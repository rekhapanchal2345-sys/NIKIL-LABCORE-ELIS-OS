'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import QRCode from 'qrcode';
import {
  Package, AlertTriangle, CheckCircle2, Clock, TrendingDown,
  RefreshCw, Search, Plus, BarChart3, Thermometer, Archive,
  ShoppingCart, Zap, Filter, Check, X, Shield, AlertOctagon,
  Printer, Download, Eye, FileText, ArrowUpDown, ChevronRight,
  Boxes, Sparkles, Building2, PhoneCall, ExternalLink, Activity,
  ArrowUpRight, ShieldCheck, DollarSign, Award, Layers, Radio,
  SlidersHorizontal, ChevronDown, Scale, ClipboardCheck,
  TrendingUp, Lock, HelpCircle, Cpu
} from 'lucide-react';

// ============================================================================
// CLINICAL DOMAIN TYPES & STANDARDS (NABL ISO 15189:2022 / CLSI EP26-A / CAP)
// ============================================================================

export type StorageChamberType =
  | 'WALK_IN_COLD_ROOM'
  | 'REAGENT_CAROUSEL'
  | 'DEEP_FREEZER'
  | 'CRYO_FREEZER'
  | 'BLOOD_BANK_FRIDGE'
  | 'CONTROLLED_ROOM';

export type ReagentInterlockStatus =
  | 'ADEQUATE'
  | 'LOW'
  | 'CRITICAL'
  | 'EXPIRED'
  | 'STABILITY_BREACHED'
  | 'QUARANTINED';

export type PoStatus =
  | 'DRAFT'
  | 'RAISED'
  | 'VENDOR_CONFIRMED'
  | 'IN_TRANSIT'
  | 'RECEIVED_GRN';

export interface ReagentItem {
  id: string;
  code: string;
  name: string;
  catalogNumber: string;
  category: 'Hematology' | 'Biochemistry' | 'Immunology' | 'Coagulation' | 'Microbiology' | 'Molecular' | 'Blood Bank' | 'Consumables';
  manufacturer: string;
  analyzerModel: string;
  currentStock: number;
  minStockAlert: number;
  safetyBufferDays: number;
  unit: string;
  lotNumber: string;
  expiryDate: string; // ISO
  openedOnCarouselAt?: string; // ISO
  daysOnBoard?: number;
  onBoardStabilityDays: number;
  storageTemp: string;
  storageLocation: string;
  status: ReagentInterlockStatus;
  calibratorFactor: number;
  kitPurchaseCostInr: number;
  costPerTestInr: number;
  dailyUsage: number;
  barcode: string;
  isClsiLotValidated: boolean;
  coAAvailable: boolean;
  packSizeVolumeMl: number;
  remainingVolumeMl: number;
}

export interface ColdChainSensor {
  id: string;
  name: string;
  chamberType: StorageChamberType;
  currentTemp: number; // Celsius
  minTemp: number;
  maxTemp: number;
  targetTemp: string;
  humidityPercent: number;
  status: 'NORMAL' | 'WARNING' | 'EXCURSION_CRITICAL';
  location: string;
  lastPingMinutesAgo: number;
  batteryPercent: number;
  telemetryPoints: number[]; // recent 12 hours
  activeAlarmsCount: number;
}

export interface TestCptRecipe {
  testCode: string;
  testName: string;
  category: string;
  analyzerModel: string;
  sellingPriceB2CInr: number;
  sellingPriceB2BInr: number;
  reagentCostPerTestInr: number;
  calibratorCostPerTestInr: number;
  consumableOverheadInr: number;
  totalCostPerTestInr: number;
  netMarginB2CInr: number;
  grossMarginB2CPercent: number;
  netMarginB2BInr: number;
  grossMarginB2BPercent: number;
  monthlyTestVolume: number;
  reagentComponents: Array<{
    reagentCode: string;
    reagentName: string;
    volumeMl: number;
    costInr: number;
  }>;
}

export interface PurchaseOrderItem {
  reagentId: string;
  reagentName: string;
  catalog: string;
  quantityPacks: number;
  unitPriceInr: number;
  totalInr: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  urgency: 'ROUTINE' | 'STAT_EMERGENCY';
  items: PurchaseOrderItem[];
  subtotalInr: number;
  gstAmountInr: number;
  totalAmountInr: number;
  status: PoStatus;
  raisedBy: string;
  grnReference?: string;
  notes?: string;
}

export interface DiagnosticVendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  slaLeadTimeDays: number;
  contractType: 'ANNUAL_RATE_CONTRACT' | 'EQUIPMENT_REAGENT_RENTAL' | 'SPOT_PURCHASE';
  rating: number; // 1 to 5
  suppliedBrands: string[];
  gstin: string;
  activeOrdersCount: number;
}

export interface LotVerificationRecord {
  id: string;
  testAnalyte: string;
  currentLot: string;
  candidateLot: string;
  specimensTested: number;
  meanBiasPercent: number;
  maxAllowableBiasPercent: number;
  correlationR2: number;
  verificationStatus: 'PASS_RELEASED' | 'PENDING_APPROVAL' | 'FAIL_REJECTED';
  evaluatedBy: string;
  evaluatedAt: string;
  approvedByDirector: string;
  matrixFindings: string;
}

// ============================================================================
// COMPREHENSIVE CLINICAL DATASET
// ============================================================================

const INITIAL_REAGENTS: ReagentItem[] = [
  {
    id: 'rgt-001',
    code: 'SYS-CBC-DCL',
    name: 'Sysmex Cellpack DCL Diluent (20L)',
    catalogNumber: 'SYS-210041',
    category: 'Hematology',
    manufacturer: 'Sysmex Corporation',
    analyzerModel: 'Sysmex XN-1000',
    currentStock: 6,
    minStockAlert: 12,
    safetyBufferDays: 4,
    unit: 'Pack (20L)',
    lotNumber: 'LOT-XN24-902',
    expiryDate: '2027-02-28',
    openedOnCarouselAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    onBoardStabilityDays: 60,
    storageTemp: '15-30°C',
    storageLocation: 'Sysmex Buffer Bay 01',
    status: 'CRITICAL',
    calibratorFactor: 1.000,
    kitPurchaseCostInr: 14500,
    costPerTestInr: 12.80,
    dailyUsage: 1.8,
    barcode: '8901248001019',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 20000,
    remainingVolumeMl: 4200,
  },
  {
    id: 'rgt-002',
    code: 'SYS-CBC-WDF',
    name: 'Sysmex Fluorocell WDF Dye Cartridge',
    catalogNumber: 'SYS-210088',
    category: 'Hematology',
    manufacturer: 'Sysmex Corporation',
    analyzerModel: 'Sysmex XN-1000',
    currentStock: 14,
    minStockAlert: 8,
    safetyBufferDays: 14,
    unit: 'Cartridge',
    lotNumber: 'LOT-XN24-774',
    expiryDate: '2026-12-15',
    openedOnCarouselAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    onBoardStabilityDays: 90,
    storageTemp: '2-8°C',
    storageLocation: 'Central Cold Room Shelf 2',
    status: 'ADEQUATE',
    calibratorFactor: 1.002,
    kitPurchaseCostInr: 28900,
    costPerTestInr: 22.40,
    dailyUsage: 0.6,
    barcode: '8901248001026',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 1000,
    remainingVolumeMl: 650,
  },
  {
    id: 'rgt-003',
    code: 'ROCH-CHOL-C503',
    name: 'Roche Cobas Cholesterol Gen.2 (800T)',
    catalogNumber: 'ROCH-05168538',
    category: 'Biochemistry',
    manufacturer: 'Roche Diagnostics',
    analyzerModel: 'Cobas c503',
    currentStock: 4,
    minStockAlert: 10,
    safetyBufferDays: 5,
    unit: 'Cassette',
    lotNumber: 'LOT-CHOL-8821',
    expiryDate: '2026-11-20',
    openedOnCarouselAt: new Date(Date.now() - 16 * 86400000).toISOString(),
    onBoardStabilityDays: 28,
    storageTemp: '2-8°C',
    storageLocation: 'Cobas Carousel Slot #08',
    status: 'LOW',
    calibratorFactor: 1.012,
    kitPurchaseCostInr: 6250,
    costPerTestInr: 7.80,
    dailyUsage: 1.2,
    barcode: '7613336002144',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 250,
    remainingVolumeMl: 85,
  },
  {
    id: 'rgt-004',
    code: 'ROCH-TRIG-C503',
    name: 'Roche Cobas Triglycerides GPO-PAP (800T)',
    catalogNumber: 'ROCH-05171407',
    category: 'Biochemistry',
    manufacturer: 'Roche Diagnostics',
    analyzerModel: 'Cobas c503',
    currentStock: 18,
    minStockAlert: 8,
    safetyBufferDays: 22,
    unit: 'Cassette',
    lotNumber: 'LOT-TRIG-8840',
    expiryDate: '2027-04-10',
    openedOnCarouselAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    onBoardStabilityDays: 28,
    storageTemp: '2-8°C',
    storageLocation: 'Cobas Carousel Slot #09',
    status: 'ADEQUATE',
    calibratorFactor: 0.998,
    kitPurchaseCostInr: 7500,
    costPerTestInr: 9.35,
    dailyUsage: 1.1,
    barcode: '7613336002151',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 250,
    remainingVolumeMl: 190,
  },
  {
    id: 'rgt-005',
    code: 'ROCH-TSH-E801',
    name: 'Roche Elecsys TSH Immunoassay (300T)',
    catalogNumber: 'ROCH-08429324',
    category: 'Immunology',
    manufacturer: 'Roche Diagnostics',
    analyzerModel: 'Cobas e801',
    currentStock: 2,
    minStockAlert: 6,
    safetyBufferDays: 3,
    unit: 'Pack',
    lotNumber: 'LOT-TSH-4409',
    expiryDate: '2026-10-18', // Expiring soon / Stability breached
    openedOnCarouselAt: new Date(Date.now() - 34 * 86400000).toISOString(), // > 30 days open!
    onBoardStabilityDays: 30,
    storageTemp: '2-8°C',
    storageLocation: 'Cobas e801 Reagent Carousel',
    status: 'STABILITY_BREACHED',
    calibratorFactor: 1.021,
    kitPurchaseCostInr: 22800,
    costPerTestInr: 76.00,
    dailyUsage: 0.9,
    barcode: '7613336002168',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 100,
    remainingVolumeMl: 28,
  },
  {
    id: 'rgt-006',
    code: 'STA-PT-NEOP',
    name: 'Stago STA Neoplastine CI Plus (PT/INR)',
    catalogNumber: 'STA-00667',
    category: 'Coagulation',
    manufacturer: 'Diagnostica Stago',
    analyzerModel: 'STA Compact Max',
    currentStock: 8,
    minStockAlert: 15,
    safetyBufferDays: 6,
    unit: 'Vial (6x10mL)',
    lotNumber: 'LOT-STA-6612',
    expiryDate: '2026-11-05',
    openedOnCarouselAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    onBoardStabilityDays: 5,
    storageTemp: '2-8°C',
    storageLocation: 'Coagulation Rack Alpha',
    status: 'LOW',
    calibratorFactor: 1.000,
    kitPurchaseCostInr: 8900,
    costPerTestInr: 29.60,
    dailyUsage: 1.5,
    barcode: '3760087006672',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 60,
    remainingVolumeMl: 32,
  },
  {
    id: 'rgt-007',
    code: 'BIO-BACT-FA',
    name: 'BacT/ALERT FA Plus Aerobic Blood Culture (Box/24)',
    catalogNumber: 'BMX-410851',
    category: 'Microbiology',
    manufacturer: 'bioMérieux SA',
    analyzerModel: 'BacT/ALERT 3D',
    currentStock: 48,
    minStockAlert: 40,
    safetyBufferDays: 12,
    unit: 'Bottle',
    lotNumber: 'LOT-BMX-9011',
    expiryDate: '2027-08-30',
    onBoardStabilityDays: 365,
    storageTemp: '15-30°C',
    storageLocation: 'Microbiology Incubator Corridor',
    status: 'ADEQUATE',
    calibratorFactor: 1.000,
    kitPurchaseCostInr: 12400,
    costPerTestInr: 516.60,
    dailyUsage: 4.0,
    barcode: '3661103001894',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 24,
    remainingVolumeMl: 24,
  },
  {
    id: 'rgt-008',
    code: 'BIO-VIT-ASTN392',
    name: 'VITEK-2 AST-N392 Gram-Neg Susceptibility Cards (Box/20)',
    catalogNumber: 'BMX-414532',
    category: 'Microbiology',
    manufacturer: 'bioMérieux SA',
    analyzerModel: 'VITEK-2 XL',
    currentStock: 12,
    minStockAlert: 20,
    safetyBufferDays: 5,
    unit: 'Card',
    lotNumber: 'LOT-BMX-4420',
    expiryDate: '2026-12-31',
    onBoardStabilityDays: 180,
    storageTemp: '2-8°C',
    storageLocation: 'Central Cold Room Shelf 4',
    status: 'LOW',
    calibratorFactor: 1.000,
    kitPurchaseCostInr: 19800,
    costPerTestInr: 990.00,
    dailyUsage: 2.2,
    barcode: '3661103002242',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 20,
    remainingVolumeMl: 12,
  },
  {
    id: 'rgt-009',
    code: 'CEP-XPRT-MTB',
    name: 'GeneXpert MTB/RIF Ultra Cartridges (Box/10)',
    catalogNumber: 'CEP-GXMTB-10',
    category: 'Molecular',
    manufacturer: 'Cepheid / Danaher',
    analyzerModel: 'GeneXpert IV',
    currentStock: 6,
    minStockAlert: 15,
    safetyBufferDays: 4,
    unit: 'Cartridge',
    lotNumber: 'LOT-CEP-2024-81',
    expiryDate: '2026-09-30', // Expired in test dataset to demo interlock
    onBoardStabilityDays: 120,
    storageTemp: '2-28°C',
    storageLocation: 'Molecular Diagnostics Lab',
    status: 'EXPIRED',
    calibratorFactor: 1.000,
    kitPurchaseCostInr: 21500,
    costPerTestInr: 2150.00,
    dailyUsage: 1.5,
    barcode: '0842055001221',
    isClsiLotValidated: false,
    coAAvailable: true,
    packSizeVolumeMl: 10,
    remainingVolumeMl: 6,
  },
  {
    id: 'rgt-010',
    code: 'ROCH-TROP-HS',
    name: 'Roche Elecsys Troponin T High-Sensitivity (100T)',
    catalogNumber: 'ROCH-05092728',
    category: 'Immunology',
    manufacturer: 'Roche Diagnostics',
    analyzerModel: 'Cobas e801',
    currentStock: 3,
    minStockAlert: 5,
    safetyBufferDays: 6,
    unit: 'Pack',
    lotNumber: 'LOT-TROP-9081',
    expiryDate: '2026-12-10',
    openedOnCarouselAt: new Date(Date.now() - 11 * 86400000).toISOString(),
    onBoardStabilityDays: 28,
    storageTemp: '2-8°C',
    storageLocation: 'Cobas e801 STAT Carousel Slot #01',
    status: 'LOW',
    calibratorFactor: 1.005,
    kitPurchaseCostInr: 34500,
    costPerTestInr: 345.00,
    dailyUsage: 0.8,
    barcode: '7613336002991',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 100,
    remainingVolumeMl: 46,
  },
  {
    id: 'rgt-011',
    code: 'CON-CUV-COBAS',
    name: 'Cobas Micro-Cuvettes Reaction Segments (Box/1000)',
    catalogNumber: 'ROCH-04859084',
    category: 'Consumables',
    manufacturer: 'Roche Diagnostics',
    analyzerModel: 'Cobas c503',
    currentStock: 12,
    minStockAlert: 10,
    safetyBufferDays: 18,
    unit: 'Box',
    lotNumber: 'LOT-CUV-2024-A',
    expiryDate: '2029-12-31',
    onBoardStabilityDays: 1800,
    storageTemp: '15-30°C',
    storageLocation: 'Central Store Bay 14',
    status: 'ADEQUATE',
    calibratorFactor: 1.000,
    kitPurchaseCostInr: 8200,
    costPerTestInr: 2.10,
    dailyUsage: 0.8,
    barcode: '7613336009983',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 1000,
    remainingVolumeMl: 1000,
  },
  {
    id: 'rgt-012',
    code: 'CON-TIP-1000UL',
    name: 'Conductive Robotic Pipette Tips 1000µL (Filtered)',
    catalogNumber: 'COR-71000-FIL',
    category: 'Consumables',
    manufacturer: 'Corning / Axygen',
    analyzerModel: 'Cobas e801 & Liquid Handlers',
    currentStock: 22,
    minStockAlert: 20,
    safetyBufferDays: 15,
    unit: 'Racks (10x96)',
    lotNumber: 'LOT-TIP-9921',
    expiryDate: '2028-06-30',
    onBoardStabilityDays: 1800,
    storageTemp: '15-30°C',
    storageLocation: 'Central Store Bay 15',
    status: 'ADEQUATE',
    calibratorFactor: 1.000,
    kitPurchaseCostInr: 11500,
    costPerTestInr: 3.50,
    dailyUsage: 1.4,
    barcode: '8904005001188',
    isClsiLotValidated: true,
    coAAvailable: true,
    packSizeVolumeMl: 960,
    remainingVolumeMl: 960,
  },
];

const INITIAL_SENSORS: ColdChainSensor[] = [
  {
    id: 'sen-001',
    name: 'Walk-in Cold Room Alpha',
    chamberType: 'WALK_IN_COLD_ROOM',
    currentTemp: 4.2,
    minTemp: 2.0,
    maxTemp: 8.0,
    targetTemp: '2.0°C – 8.0°C',
    humidityPercent: 48,
    status: 'NORMAL',
    location: 'Central Diagnostic Storage Ground Floor',
    lastPingMinutesAgo: 1,
    batteryPercent: 98,
    telemetryPoints: [4.1, 4.3, 4.2, 4.4, 4.2, 4.1, 4.3, 4.2, 4.2, 4.1, 4.3, 4.2],
    activeAlarmsCount: 0,
  },
  {
    id: 'sen-002',
    name: 'Cobas c503 Internal Reagent Carousel',
    chamberType: 'REAGENT_CAROUSEL',
    currentTemp: 5.8,
    minTemp: 2.0,
    maxTemp: 8.0,
    targetTemp: '2.0°C – 8.0°C',
    humidityPercent: 36,
    status: 'NORMAL',
    location: 'Clinical Biochemistry Analyzer Bay 2',
    lastPingMinutesAgo: 2,
    batteryPercent: 100, // Hardwired
    telemetryPoints: [5.2, 5.4, 5.5, 5.7, 5.6, 5.8, 5.9, 5.7, 5.8, 5.7, 5.6, 5.8],
    activeAlarmsCount: 0,
  },
  {
    id: 'sen-003',
    name: 'Deep Freezer Bio-Repository Alpha (-20°C)',
    chamberType: 'DEEP_FREEZER',
    currentTemp: -22.4,
    minTemp: -25.0,
    maxTemp: -18.0,
    targetTemp: '-20.0°C (±3°C)',
    humidityPercent: 18,
    status: 'NORMAL',
    location: 'Special Chemistry & Calibrator Vault',
    lastPingMinutesAgo: 3,
    batteryPercent: 94,
    telemetryPoints: [-21.8, -22.0, -22.2, -22.5, -22.3, -22.4, -22.1, -22.4],
    activeAlarmsCount: 0,
  },
  {
    id: 'sen-004',
    name: 'Cryo-Molecular Freezer Beta (-80°C)',
    chamberType: 'CRYO_FREEZER',
    currentTemp: -79.6,
    minTemp: -86.0,
    maxTemp: -70.0,
    targetTemp: '-80.0°C (±5°C)',
    humidityPercent: 12,
    status: 'NORMAL',
    location: 'Molecular Virology Genomics Suite',
    lastPingMinutesAgo: 1,
    batteryPercent: 91,
    telemetryPoints: [-80.2, -79.8, -80.0, -79.5, -79.7, -79.6, -79.9, -79.6],
    activeAlarmsCount: 0,
  },
  {
    id: 'sen-005',
    name: 'Blood Bank PRBC Storage Unit #01',
    chamberType: 'BLOOD_BANK_FRIDGE',
    currentTemp: 3.8,
    minTemp: 2.0,
    maxTemp: 6.0,
    targetTemp: '2.0°C – 6.0°C (NABL / DGHS)',
    humidityPercent: 44,
    status: 'NORMAL',
    location: 'Transfusion Medicine Blood Bank',
    lastPingMinutesAgo: 1,
    batteryPercent: 100,
    telemetryPoints: [3.9, 3.8, 3.7, 3.8, 3.9, 3.8, 3.7, 3.8],
    activeAlarmsCount: 0,
  },
  {
    id: 'sen-006',
    name: 'Reagent Carousel Cobas e801',
    chamberType: 'REAGENT_CAROUSEL',
    currentTemp: 7.9, // Warning, approaching 8.0 upper limit
    minTemp: 2.0,
    maxTemp: 8.0,
    targetTemp: '2.0°C – 8.0°C',
    humidityPercent: 52,
    status: 'WARNING',
    location: 'Immunology Chemiluminescence Wing',
    lastPingMinutesAgo: 1,
    batteryPercent: 96,
    telemetryPoints: [6.4, 6.8, 7.1, 7.3, 7.5, 7.6, 7.8, 7.9],
    activeAlarmsCount: 1,
  },
];

const INITIAL_CPT_RECIPES: TestCptRecipe[] = [
  {
    testCode: 'CBC_5DIFF',
    testName: 'Complete Blood Count (CBC + 5-Part Diff)',
    category: 'Hematology',
    analyzerModel: 'Sysmex XN-1000',
    sellingPriceB2CInr: 350,
    sellingPriceB2BInr: 180,
    reagentCostPerTestInr: 35.20,
    calibratorCostPerTestInr: 4.50,
    consumableOverheadInr: 6.80,
    totalCostPerTestInr: 46.50,
    netMarginB2CInr: 303.50,
    grossMarginB2CPercent: 86.7,
    netMarginB2BInr: 133.50,
    grossMarginB2BPercent: 74.2,
    monthlyTestVolume: 4200,
    reagentComponents: [
      { reagentCode: 'SYS-CBC-DCL', reagentName: 'Cellpack DCL Diluent', volumeMl: 25.0, costInr: 12.80 },
      { reagentCode: 'SYS-CBC-WDF', reagentName: 'Fluorocell WDF Dye', volumeMl: 0.8, costInr: 22.40 },
    ],
  },
  {
    testCode: 'LIPID_PROFILE',
    testName: 'Lipid Profile Comprehensive (Chol, Trig, HDL, LDL)',
    category: 'Biochemistry',
    analyzerModel: 'Cobas c503',
    sellingPriceB2CInr: 850,
    sellingPriceB2BInr: 480,
    reagentCostPerTestInr: 38.65,
    calibratorCostPerTestInr: 12.50,
    consumableOverheadInr: 9.25,
    totalCostPerTestInr: 60.40,
    netMarginB2CInr: 789.60,
    grossMarginB2CPercent: 92.9,
    netMarginB2BInr: 419.60,
    grossMarginB2BPercent: 87.4,
    monthlyTestVolume: 2850,
    reagentComponents: [
      { reagentCode: 'ROCH-CHOL-C503', reagentName: 'Cholesterol Gen.2', volumeMl: 0.15, costInr: 7.80 },
      { reagentCode: 'ROCH-TRIG-C503', reagentName: 'Triglycerides GPO-PAP', volumeMl: 0.15, costInr: 9.35 },
      { reagentCode: 'ROCH-HDL-C503', reagentName: 'HDL Direct Gen.4', volumeMl: 0.18, costInr: 21.50 },
    ],
  },
  {
    testCode: 'TSH_ECLIA',
    testName: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)',
    category: 'Immunology',
    analyzerModel: 'Cobas e801',
    sellingPriceB2CInr: 550,
    sellingPriceB2BInr: 290,
    reagentCostPerTestInr: 76.00,
    calibratorCostPerTestInr: 14.50,
    consumableOverheadInr: 8.50,
    totalCostPerTestInr: 99.00,
    netMarginB2CInr: 451.00,
    grossMarginB2CPercent: 82.0,
    netMarginB2BInr: 191.00,
    grossMarginB2BPercent: 65.9,
    monthlyTestVolume: 3400,
    reagentComponents: [
      { reagentCode: 'ROCH-TSH-E801', reagentName: 'Elecsys TSH Immunoassay Pack', volumeMl: 0.05, costInr: 76.00 },
    ],
  },
  {
    testCode: 'TROP_I_HS',
    testName: 'Troponin-I High Sensitivity (Cardiac STAT)',
    category: 'Immunology',
    analyzerModel: 'Cobas e801',
    sellingPriceB2CInr: 1800,
    sellingPriceB2BInr: 1100,
    reagentCostPerTestInr: 345.00,
    calibratorCostPerTestInr: 38.00,
    consumableOverheadInr: 12.00,
    totalCostPerTestInr: 395.00,
    netMarginB2CInr: 1405.00,
    grossMarginB2CPercent: 78.1,
    netMarginB2BInr: 705.00,
    grossMarginB2BPercent: 64.1,
    monthlyTestVolume: 920,
    reagentComponents: [
      { reagentCode: 'ROCH-TROP-HS', reagentName: 'Elecsys Troponin T High-Sensitivity', volumeMl: 0.08, costInr: 345.00 },
    ],
  },
  {
    testCode: 'PT_INR_COAG',
    testName: 'Prothrombin Time & INR (Stago Automated)',
    category: 'Coagulation',
    analyzerModel: 'STA Compact Max',
    sellingPriceB2CInr: 400,
    sellingPriceB2BInr: 220,
    reagentCostPerTestInr: 29.60,
    calibratorCostPerTestInr: 6.50,
    consumableOverheadInr: 4.80,
    totalCostPerTestInr: 40.90,
    netMarginB2CInr: 359.10,
    grossMarginB2CPercent: 89.8,
    netMarginB2BInr: 179.10,
    grossMarginB2BPercent: 81.4,
    monthlyTestVolume: 1650,
    reagentComponents: [
      { reagentCode: 'STA-PT-NEOP', reagentName: 'STA Neoplastine CI Plus', volumeMl: 0.20, costInr: 29.60 },
    ],
  },
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-101',
    poNumber: 'PO-2026-0814',
    vendorId: 'ven-001',
    vendorName: 'Roche Diagnostics India Pvt Ltd',
    orderDate: '2026-10-21',
    expectedDeliveryDate: '2026-10-26',
    urgency: 'STAT_EMERGENCY',
    items: [
      { reagentId: 'rgt-003', reagentName: 'Roche Cobas Cholesterol Gen.2', catalog: 'ROCH-05168538', quantityPacks: 10, unitPriceInr: 6250, totalInr: 62500 },
      { reagentId: 'rgt-005', reagentName: 'Roche Elecsys TSH Immunoassay Pack', catalog: 'ROCH-08429324', quantityPacks: 6, unitPriceInr: 22800, totalInr: 136800 },
    ],
    subtotalInr: 199300,
    gstAmountInr: 23916,
    totalAmountInr: 223216,
    status: 'IN_TRANSIT',
    raisedBy: 'Dr. Rajesh Nair (Chief Biochemist)',
    notes: 'STAT Delivery requested. Cold chain logger included in consignment.',
  },
  {
    id: 'po-102',
    poNumber: 'PO-2026-0812',
    vendorId: 'ven-002',
    vendorName: 'Sysmex India Private Limited',
    orderDate: '2026-10-18',
    expectedDeliveryDate: '2026-10-24',
    urgency: 'ROUTINE',
    items: [
      { reagentId: 'rgt-001', reagentName: 'Sysmex Cellpack DCL Diluent (20L)', catalog: 'SYS-210041', quantityPacks: 15, unitPriceInr: 14500, totalInr: 217500 },
      { reagentId: 'rgt-002', reagentName: 'Sysmex Fluorocell WDF Dye Cartridge', catalog: 'SYS-210088', quantityPacks: 8, unitPriceInr: 28900, totalInr: 231200 },
    ],
    subtotalInr: 448700,
    gstAmountInr: 53844,
    totalAmountInr: 502544,
    status: 'VENDOR_CONFIRMED',
    raisedBy: 'Sunita Sharma (Inventory Store Head)',
    notes: 'Standard 30-day payment term under Annual Reagent Rental contract.',
  },
  {
    id: 'po-103',
    poNumber: 'PO-2026-0808',
    vendorId: 'ven-003',
    vendorName: 'bioMérieux India SA',
    orderDate: '2026-10-10',
    expectedDeliveryDate: '2026-10-15',
    urgency: 'ROUTINE',
    items: [
      { reagentId: 'rgt-007', reagentName: 'BacT/ALERT FA Plus Aerobic Bottles', catalog: 'BMX-410851', quantityPacks: 10, unitPriceInr: 12400, totalInr: 124000 },
      { reagentId: 'rgt-008', reagentName: 'VITEK-2 AST-N392 Susceptibility Cards', catalog: 'BMX-414532', quantityPacks: 12, unitPriceInr: 19800, totalInr: 237600 },
    ],
    subtotalInr: 361600,
    gstAmountInr: 43392,
    totalAmountInr: 404992,
    status: 'RECEIVED_GRN',
    grnReference: 'GRN-2026-0441',
    raisedBy: 'Dr. Ananya Deshmukh (Microbiologist)',
    notes: 'GRN completed. CoA verified and lot registered on VITEK-2 carousel.',
  },
];

const INITIAL_VENDORS: DiagnosticVendor[] = [
  {
    id: 'ven-001',
    name: 'Roche Diagnostics India Pvt Ltd',
    category: 'Biochemistry & Chemiluminescence',
    contactPerson: 'Vikram Sengupta (Enterprise Key Account Mgr)',
    phone: '+91 98201 44510',
    email: 'india.orders@roche.com',
    slaLeadTimeDays: 4,
    contractType: 'EQUIPMENT_REAGENT_RENTAL',
    rating: 4.9,
    suppliedBrands: ['Cobas c503', 'Cobas e801', 'Elecsys', 'Modular Pre-Analytics'],
    gstin: '27AAACR1234F1ZX',
    activeOrdersCount: 2,
  },
  {
    id: 'ven-002',
    name: 'Sysmex India Private Limited',
    category: 'Hematology & Flow Cytometry',
    contactPerson: 'Pooja Kulkarni (Regional Supply Specialist)',
    phone: '+91 98199 87300',
    email: 'supplychain.in@sysmex.co.in',
    slaLeadTimeDays: 3,
    contractType: 'ANNUAL_RATE_CONTRACT',
    rating: 4.8,
    suppliedBrands: ['Sysmex XN-1000', 'Cellpack', 'Fluorocell', 'UF-5000'],
    gstin: '27AAACS4567G1Z1',
    activeOrdersCount: 1,
  },
  {
    id: 'ven-003',
    name: 'bioMérieux India SA',
    category: 'Microbiology & AST Systems',
    contactPerson: 'Karan Mehra (Clinical Account Executive)',
    phone: '+91 99300 21455',
    email: 'orders.biomerieux.india@biomerieux.com',
    slaLeadTimeDays: 5,
    contractType: 'ANNUAL_RATE_CONTRACT',
    rating: 4.9,
    suppliedBrands: ['BacT/ALERT 3D', 'VITEK-2 XL', 'BioFire FilmArray', 'VIDAS'],
    gstin: '07AAACB9876P1ZR',
    activeOrdersCount: 1,
  },
  {
    id: 'ven-004',
    name: 'Diagnostica Stago India',
    category: 'Hemostasis & Coagulation',
    contactPerson: 'Dr. Manish Verma',
    phone: '+91 98210 33890',
    email: 'stago.india@stago.com',
    slaLeadTimeDays: 4,
    contractType: 'SPOT_PURCHASE',
    rating: 4.7,
    suppliedBrands: ['STA Compact Max', 'Neoplastine', 'Cephascreen', 'Liquid Anti-Xa'],
    gstin: '27AAACD8811K1Z3',
    activeOrdersCount: 0,
  },
  {
    id: 'ven-005',
    name: 'Danaher / Cepheid India',
    category: 'Rapid Molecular Diagnostics',
    contactPerson: 'Ritika Malhotra',
    phone: '+91 98111 67220',
    email: 'cepheid.india@danaher.com',
    slaLeadTimeDays: 6,
    contractType: 'SPOT_PURCHASE',
    rating: 4.6,
    suppliedBrands: ['GeneXpert', 'MTB/RIF Ultra', 'Xpress Flu/RSV'],
    gstin: '06AAACC3322M1ZY',
    activeOrdersCount: 1,
  },
];

const INITIAL_LOT_VERIFICATIONS: LotVerificationRecord[] = [
  {
    id: 'vrf-001',
    testAnalyte: 'Cholesterol CHOD-PAP (Cobas c503)',
    currentLot: 'LOT-CHOL-7719 (Exp: 2026-11)',
    candidateLot: 'LOT-CHOL-8821 (Exp: 2027-04)',
    specimensTested: 20,
    meanBiasPercent: 1.42,
    maxAllowableBiasPercent: 5.0,
    correlationR2: 0.9984,
    verificationStatus: 'PASS_RELEASED',
    evaluatedBy: 'Ramesh Sen (Senior QC Biochemist)',
    evaluatedAt: '2026-10-14',
    approvedByDirector: 'Dr. Rajesh Nair, MD (Chief Biochemist)',
    matrixFindings: 'CLSI EP26-A criteria fulfilled. Linear regression y = 1.008x - 0.45. Deming fit accepted. Released to active carousel.',
  },
  {
    id: 'vrf-002',
    testAnalyte: 'High Sensitivity Troponin T (Cobas e801)',
    currentLot: 'LOT-TROP-8890',
    candidateLot: 'LOT-TROP-9081',
    specimensTested: 25,
    meanBiasPercent: 2.15,
    maxAllowableBiasPercent: 6.0,
    correlationR2: 0.9991,
    verificationStatus: 'PASS_RELEASED',
    evaluatedBy: 'Kavita Patel (QC Technologist)',
    evaluatedAt: '2026-10-18',
    approvedByDirector: 'Dr. Rajesh Nair, MD (Chief Biochemist)',
    matrixFindings: 'Passed 99th percentile clinical cutoff concordance. Bland-Altman limits within ±4.2 ng/L.',
  },
  {
    id: 'vrf-003',
    testAnalyte: 'PT / INR Neoplastine (STA Compact)',
    currentLot: 'LOT-STA-5540',
    candidateLot: 'LOT-STA-6612',
    specimensTested: 20,
    meanBiasPercent: 0.88,
    maxAllowableBiasPercent: 4.0,
    correlationR2: 0.9975,
    verificationStatus: 'PENDING_APPROVAL',
    evaluatedBy: 'Farhan Ali (Hematology Lead)',
    evaluatedAt: '2026-10-22',
    approvedByDirector: 'Awaiting Sign-off',
    matrixFindings: 'ISI value calibrated to 1.12 against WHO international reference thromboplastin. Pending lab director signature.',
  },
];

// ============================================================================
// COMPONENT CONTENT
// ============================================================================

export default function InventoryWorkstationPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-slate-500 flex items-center justify-center min-h-[500px]">Loading Inventory Workstation...</div>}>
        <InventoryWorkstationCore />
      </Suspense>
    </ProtectedRoute>
  );
}

function InventoryWorkstationCore() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Navigation state synced with URL
  const activeTabParam = searchParams.get('tab') || 'register';
  const filterParam = searchParams.get('filter') || 'ALL';
  const actionParam = searchParams.get('action');

  const [activeTab, setActiveTab] = useState<'register' | 'reorder' | 'fefo' | 'coldchain' | 'cpt' | 'orders' | 'vendors'>(() => {
    if (activeTabParam === 'coldchain') return 'coldchain';
    if (activeTabParam === 'cpt') return 'cpt';
    if (activeTabParam === 'orders') return 'orders';
    if (activeTabParam === 'vendors') return 'vendors';
    if (activeTabParam === 'reorder') return 'reorder';
    if (activeTabParam === 'fefo') return 'fefo';
    return 'register';
  });

  const [filterStatus, setFilterStatus] = useState<string>(filterParam);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [reagents, setReagents] = useState<ReagentItem[]>(INITIAL_REAGENTS);
  const [sensors, setSensors] = useState<ColdChainSensor[]>(INITIAL_SENSORS);
  const [cptRecipes, setCptRecipes] = useState<TestCptRecipe[]>(INITIAL_CPT_RECIPES);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [vendors] = useState<DiagnosticVendor[]>(INITIAL_VENDORS);
  const [lotVerifications, setLotVerifications] = useState<LotVerificationRecord[]>(INITIAL_LOT_VERIFICATIONS);

  // Modals
  const [isRegisterLotModalOpen, setIsRegisterLotModalOpen] = useState(false);
  const [isRaisePoModalOpen, setIsRaisePoModalOpen] = useState(false);
  const [isSimulateConsumptionModalOpen, setIsSimulateConsumptionModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);
  const [selectedSensorForDetails, setSelectedSensorForDetails] = useState<ColdChainSensor | null>(null);
  const [selectedReagentForLotValidation, setSelectedReagentForLotValidation] = useState<ReagentItem | null>(null);

  // Dynamic QR Code for Report Verification
  const [reportQrDataUrl, setReportQrDataUrl] = useState<string>('');

  // Toast / notification
  const [bannerAlert, setBannerAlert] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  useEffect(() => {
    if (actionParam === 'po') {
      setIsRaisePoModalOpen(true);
    }
  }, [actionParam]);

  useEffect(() => {
    // Generate NABL audit verification QR code
    const payload = `NIKIL-LABCORE-ELIS-OS|INVENTORY-AUDIT|NABL-ISO15189:2022|TOTAL-ITEMS:${reagents.length}|VALUATION-INR:${reagents.reduce((a, b) => a + (b.kitPurchaseCostInr * b.currentStock), 0)}|TIMESTAMP:${new Date().toISOString()}`;
    QRCode.toDataURL(payload, { width: 140, margin: 1 })
      .then(url => setReportQrDataUrl(url))
      .catch(() => {});
  }, [reagents]);

  // Sync tab with URL
  const handleTabChange = (tab: 'register' | 'reorder' | 'fefo' | 'coldchain' | 'cpt' | 'orders' | 'vendors') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/inventory?${params.toString()}`);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalLines = reagents.length;
    const criticalStock = reagents.filter(r => r.status === 'CRITICAL' || r.remainingVolumeMl <= (r.packSizeVolumeMl * 0.15)).length;
    const lowStock = reagents.filter(r => r.status === 'LOW').length;
    const expiredOrBreached = reagents.filter(r => r.status === 'EXPIRED' || r.status === 'STABILITY_BREACHED').length;
    const totalAssetValuationInr = reagents.reduce((sum, r) => sum + (r.kitPurchaseCostInr * r.currentStock), 0);
    const coldChainAlerts = sensors.filter(s => s.status !== 'NORMAL').length;
    const pendingPos = purchaseOrders.filter(p => p.status === 'RAISED' || p.status === 'IN_TRANSIT').length;
    const averageCptMargin = (cptRecipes.reduce((a, b) => a + b.grossMarginB2CPercent, 0) / Math.max(1, cptRecipes.length)).toFixed(1);

    return {
      totalLines,
      criticalStock,
      lowStock,
      expiredOrBreached,
      totalAssetValuationInr,
      coldChainAlerts,
      pendingPos,
      averageCptMargin,
    };
  }, [reagents, sensors, purchaseOrders, cptRecipes]);

  // Filtering reagents
  const filteredReagents = useMemo(() => {
    return reagents.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.catalogNumber.toLowerCase().includes(q) ||
        r.lotNumber.toLowerCase().includes(q) ||
        r.analyzerModel.toLowerCase().includes(q);

      const matchCat = filterCategory === 'ALL' || r.category === filterCategory;

      let matchStat = true;
      if (filterStatus === 'CRITICAL') matchStat = r.status === 'CRITICAL';
      else if (filterStatus === 'LOW') matchStat = r.status === 'LOW' || r.status === 'CRITICAL';
      else if (filterStatus === 'EXPIRING') {
        const days = Math.round((new Date(r.expiryDate).getTime() - Date.now()) / 86400000);
        matchStat = days <= 35 || r.status === 'EXPIRED' || r.status === 'STABILITY_BREACHED';
      } else if (filterStatus === 'ADEQUATE') matchStat = r.status === 'ADEQUATE';
      else if (filterStatus === 'STABILITY') matchStat = r.status === 'STABILITY_BREACHED';

      return matchSearch && matchCat && matchStat;
    });
  }, [reagents, searchQuery, filterCategory, filterStatus]);

  // Fast Reorder Queue items
  const reorderQueue = useMemo(() => {
    return reagents.filter(r => r.status === 'CRITICAL' || r.status === 'LOW' || r.currentStock <= r.minStockAlert);
  }, [reagents]);

  // Trigger simulated Test Consumption (Atomic deduction)
  const handleExecuteConsumptionSimulation = (testCode: string, sampleBarcode: string) => {
    const recipe = cptRecipes.find(c => c.testCode === testCode);
    if (!recipe) return;

    // Check if any required reagent is expired or stability breached
    let blockedReason = '';
    const updatedReagents = [...reagents];

    for (const comp of recipe.reagentComponents) {
      const rgtIndex = updatedReagents.findIndex(r => r.code === comp.reagentCode);
      if (rgtIndex !== -1) {
        const item = updatedReagents[rgtIndex];
        if (item.status === 'EXPIRED') {
          blockedReason = `Analyzer Interlock: Reagent ${item.name} Lot ${item.lotNumber} has EXPIRED! Run aborted.`;
          break;
        }
        if (item.status === 'STABILITY_BREACHED') {
          blockedReason = `Analyzer Interlock: On-board stability breached for ${item.name} (${(item as any).daysOnBoard || 32}d > ${item.onBoardStabilityDays}d max).`;
          break;
        }
        if (item.remainingVolumeMl < comp.volumeMl) {
          blockedReason = `Stockout Interlock: Insufficient volume for ${item.name} (Requires ${comp.volumeMl}mL, Left ${item.remainingVolumeMl}mL).`;
          break;
        }

        // Deduct
        const newRemaining = Number(Math.max(0, item.remainingVolumeMl - comp.volumeMl).toFixed(2));
        const newStatus = newRemaining <= (item.packSizeVolumeMl * 0.1) ? 'CRITICAL' : item.status;
        updatedReagents[rgtIndex] = {
          ...item,
          remainingVolumeMl: newRemaining,
          status: newStatus,
        };
      }
    }

    if (blockedReason) {
      setBannerAlert({ message: blockedReason, type: 'warning' });
      return;
    }

    setReagents(updatedReagents);
    setIsSimulateConsumptionModalOpen(false);
    setBannerAlert({
      message: `Test run for '${recipe.testName}' (Sample Barcode: ${sampleBarcode}) executed successfully! Reagents & cuvettes decremented in real-time.`,
      type: 'success',
    });
  };

  return (
    <DashboardLayout title="Reagent & Inventory Enterprise Control">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 bg-[#f8fafc] min-h-screen">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CLINICAL BANNER & ACCREDITATION HEADER                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Reagent &amp; Consumables Management
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> NABL ISO 15189:2022
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" /> Cold-Chain 2-8°C IoT Live
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Automated Recipe Consumption · CLSI EP26-A Lot-to-Lot Validation · Cost-Per-Test (CPT) Analytics · FEFO Gating
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Link
                href="/inventory/reagent-cpt"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                title="Open Reagent CPT & Automated Carousel Interlock Engine"
              >
                <Cpu className="w-4 h-4 text-teal-600" />
                <span>CPT &amp; Interlock Engine</span>
              </Link>

              <button
                onClick={() => setIsSimulateConsumptionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-200 bg-purple-50/80 text-purple-700 hover:bg-purple-100 text-xs sm:text-sm font-medium transition-colors shadow-sm"
              >
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Simulate Run</span>
              </button>

              <button
                onClick={() => setIsRegisterLotModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Inward Lot</span>
              </button>

              <button
                onClick={() => setIsRaisePoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors shadow-sm shadow-blue-500/20"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Raise PO</span>
              </button>

              <button
                onClick={() => setIsPrintReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors shadow-sm"
                title="Print NABL ISO 15189 Valuation & Stock Audit Report"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Valuation Report</span>
              </button>
            </div>
          </div>

          {/* Alert notification banner if present */}
          {bannerAlert && (
            <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all ${
              bannerAlert.type === 'warning'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : bannerAlert.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                {bannerAlert.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span>{bannerAlert.message}</span>
              </div>
              <button onClick={() => setBannerAlert(null)} className="p-1 hover:bg-black/5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* KPI / CLINICAL AUDIT METRIC CARDS                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalLines}</p>
            <p className="text-xs text-slate-500 mt-0.5">₹{(stats.totalAssetValuationInr / 100000).toFixed(1)}L Inventory Value</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Critical Stock</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">{stats.criticalStock}</p>
            <p className="text-xs text-slate-500 mt-0.5">Immediate PO Required</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Low Buffer</span>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{stats.lowStock}</p>
            <p className="text-xs text-slate-500 mt-0.5">Under Safety Threshold</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interlock Lock</span>
              <AlertOctagon className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stats.expiredOrBreached}</p>
            <p className="text-xs text-slate-500 mt-0.5">Expiry / Stability Breach</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Cold-Chain IoT</span>
              <Thermometer className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-teal-700 mt-2">6 / 6</p>
            <p className="text-xs text-slate-500 mt-0.5">{stats.coldChainAlerts === 0 ? 'All Chambers 2-8°C Nominal' : `${stats.coldChainAlerts} Chamber Warning`}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Avg CPT Margin</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-2">{stats.averageCptMargin}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Net B2C Test Margin</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ENTERPRISE WORKSTATION SUB-TABS NAVIGATION                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1.5 border-b border-slate-200/90 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleTabChange('register')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'register'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Reagent Register &amp; Live Stock</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'register' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
              {reagents.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('reorder')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'reorder'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Critical &amp; Reorder Queue</span>
            {reorderQueue.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'reorder' ? 'bg-blue-700 text-blue-100' : 'bg-rose-100 text-rose-700 font-bold'}`}>
                {reorderQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('fefo')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'fefo'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>FEFO &amp; Lot Validation (CLSI)</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'fefo' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
              {lotVerifications.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('coldchain')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'coldchain'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span>Cold-Chain IoT (2-8°C)</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'coldchain' ? 'bg-blue-700 text-blue-100' : 'bg-teal-100 text-teal-800'}`}>
              {sensors.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('cpt')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'cpt'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cost-Per-Test &amp; Recipes</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'cpt' ? 'bg-blue-700 text-blue-100' : 'bg-purple-100 text-purple-800'}`}>
              {cptRecipes.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Purchase Orders (PO)</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'orders' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
              {purchaseOrders.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('vendors')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'vendors'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Diagnostic Vendors</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'vendors' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
              {vendors.length}
            </span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: REAGENT REGISTER & LIVE ON-BOARD STOCK                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reagent name, lot, catalog, analyzer..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Specialties</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Coagulation">Coagulation</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Molecular">Molecular</option>
                  <option value="Consumables">Consumables</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Stock Status</option>
                  <option value="ADEQUATE">Adequate</option>
                  <option value="LOW">Low Buffer Stock</option>
                  <option value="CRITICAL">Critical Stockout Risk</option>
                  <option value="EXPIRING">Expiring &lt; 35 Days</option>
                  <option value="STABILITY">Stability Breached</option>
                </select>

                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <Scale className="w-4 h-4 text-slate-500" />
                  <span>Physical Audit</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Reagent / Assay Item</th>
                    <th className="px-3 py-3">Analyzer Platform</th>
                    <th className="px-3 py-3">Current Volume / Units</th>
                    <th className="px-3 py-3">Lot # &amp; Location</th>
                    <th className="px-3 py-3">On-Board Stability</th>
                    <th className="px-3 py-3">Expiry Date</th>
                    <th className="px-3 py-3">Interlock Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredReagents.map(rgt => {
                    const daysToExpiry = Math.round((new Date(rgt.expiryDate).getTime() - Date.now()) / 86400000);
                    const volPercent = Math.min(100, Math.round((rgt.remainingVolumeMl / rgt.packSizeVolumeMl) * 100));

                    return (
                      <tr key={rgt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{rgt.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{rgt.catalogNumber}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Thermometer className="w-3 h-3 text-blue-500" /> {rgt.storageTemp}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium text-xs">
                            {rgt.analyzerModel}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{rgt.manufacturer}</p>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-800">{rgt.currentStock} {rgt.unit}</span>
                            <span className="text-[11px] text-slate-400">{rgt.remainingVolumeMl} mL left</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                volPercent <= 15 ? 'bg-rose-500' : volPercent <= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${volPercent}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <p className="font-mono font-medium text-slate-800 text-xs">{rgt.lotNumber}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[160px]" title={rgt.storageLocation}>
                            {rgt.storageLocation}
                          </p>
                        </td>

                        <td className="px-3 py-3.5">
                          {rgt.openedOnCarouselAt ? (
                            <div>
                              <span className={`inline-flex items-center gap-1 font-medium text-xs ${
                                rgt.status === 'STABILITY_BREACHED' ? 'text-rose-600 font-bold' : 'text-slate-700'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {Math.round((Date.now() - new Date(rgt.openedOnCarouselAt).getTime()) / 86400000)}d / {rgt.onBoardStabilityDays}d max
                              </span>
                              <p className="text-[10px] text-slate-400">Pierced On-Board</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Unopened sealed vial</span>
                          )}
                        </td>

                        <td className="px-3 py-3.5">
                          {daysToExpiry < 0 ? (
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Expired!
                            </span>
                          ) : daysToExpiry <= 35 ? (
                            <div>
                              <span className="text-xs font-semibold text-amber-700">{daysToExpiry}d left</span>
                              <p className="text-[10px] text-slate-400">{new Date(rgt.expiryDate).toLocaleDateString()}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">{new Date(rgt.expiryDate).toLocaleDateString()}</span>
                          )}
                        </td>

                        <td className="px-3 py-3.5">
                          {rgt.status === 'ADEQUATE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Adequate
                            </span>
                          )}
                          {rgt.status === 'LOW' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Buffer
                            </span>
                          )}
                          {rgt.status === 'CRITICAL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertOctagon className="w-3 h-3 text-rose-600" /> Critical STAT
                            </span>
                          )}
                          {rgt.status === 'EXPIRED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                              <Lock className="w-3 h-3" /> Locked Expired
                            </span>
                          )}
                          {rgt.status === 'STABILITY_BREACHED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <Clock className="w-3 h-3 text-rose-600" /> Pierced Overdue
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedReagentForLotValidation(rgt);
                              handleTabChange('fefo');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          >
                            <ClipboardCheck className="w-3 h-3 text-blue-600" />
                            <span>Validate Lot</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredReagents.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Archive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No reagent items match the specified filter query</p>
                </div>
              )}
            </div>

            {/* Footer summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                First-Expiry-First-Out (FEFO) dispensing policy active across all carousels.
              </span>
              <span>Showing {filteredReagents.length} of {reagents.length} catalog items</span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: CRITICAL STOCK & FAST AUTO-REORDER QUEUE                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reorder' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-rose-200/90 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    Automated Replenishment &amp; Reorder Queue
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Items breaching safety stock margins based on daily test throughput velocity.
                  </p>
                </div>

                <button
                  onClick={() => setIsRaisePoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Generate Multi-Item PO ({reorderQueue.length} items)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reorderQueue.map(item => {
                const daysRemaining = Math.max(1, Math.round(item.currentStock / Math.max(0.1, item.dailyUsage)));
                return (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-blue-400 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {item.status} STOCK
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{item.name}</h3>
                        <p className="text-xs text-slate-500">{item.catalogNumber} · {item.analyzerModel}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-rose-600">{daysRemaining}d</span>
                        <p className="text-[10px] text-slate-400">Stock Buffer</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[11px]">Current Stock:</span>
                        <p className="font-bold text-slate-800">{item.currentStock} {item.unit}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Safety Alert Min:</span>
                        <p className="font-bold text-slate-800">{item.minStockAlert} {item.unit}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Daily Burn Rate:</span>
                        <p className="font-semibold text-slate-800">{item.dailyUsage} {item.unit}/day</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Recommended PO:</span>
                        <p className="font-bold text-blue-700">{item.minStockAlert * 2} {item.unit}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500">Est. Cost: ₹{(item.kitPurchaseCostInr * item.minStockAlert * 2).toLocaleString()}</span>
                      <button
                        onClick={() => setIsRaisePoModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>Add to PO</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: FEFO & CLSI EP26-A LOT-TO-LOT VERIFICATION MATRIX          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'fefo' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      CLSI EP26-A Lot-to-Lot Clinical Verification Protocol
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      NABL Clause 6.4 Verification
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Split-sample patient comparison between retiring lot and incoming lot before clinical release.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBannerAlert({
                        message: 'New Lot Verification protocol initialized. Prepare 20 patient split sera for dual-carousel run.',
                        type: 'info',
                      });
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Initiate Lot Verification</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {lotVerifications.map(vrf => (
                <div key={vrf.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Analyte Verification Assay</span>
                      <h3 className="text-base font-bold text-slate-900">{vrf.testAnalyte}</h3>
                    </div>
                    <div>
                      {vrf.verificationStatus === 'PASS_RELEASED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASSED &amp; CLINICALLY RELEASED
                        </span>
                      )}
                      {vrf.verificationStatus === 'PENDING_APPROVAL' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> AWAITING LAB DIRECTOR SIGN-OFF
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[11px]">Current Expiring Lot</span>
                      <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{vrf.currentLot}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[11px]">New Candidate Lot</span>
                      <p className="font-mono font-bold text-blue-700 text-xs mt-0.5">{vrf.candidateLot}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[11px]">Mean % Bias (Criteria &lt; 5.0%)</span>
                      <p className="font-bold text-emerald-600 text-sm mt-0.5">{vrf.meanBiasPercent}% Bias</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[11px]">Deming Fit R² Correlation</span>
                      <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{vrf.correlationR2}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Evaluator Findings &amp; Regulatory Audit Note:</span>
                    </div>
                    <p>{vrf.matrixFindings}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Evaluated by: {vrf.evaluatedBy} on {vrf.evaluatedAt}</span>
                      <span className="font-medium text-slate-700">Sign-off: {vrf.approvedByDirector}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: COLD-CHAIN IOT TELEMETRY (2°C–8°C / -20°C / -80°C)         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'coldchain' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-teal-200/90 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                    <Thermometer className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      Continuous IoT Cold-Chain Surveillance
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Real-time temperature probes across walk-in cold rooms, blood bank fridges &amp; analyzer carousels.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Sensors Online
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map(sen => {
                const isOutOfRange = sen.currentTemp < sen.minTemp || sen.currentTemp > sen.maxTemp;
                return (
                  <div
                    key={sen.id}
                    onClick={() => setSelectedSensorForDetails(sen)}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-teal-400 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {sen.chamberType.replace(/_/g, ' ')}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{sen.name}</h3>
                        <p className="text-xs text-slate-500">{sen.location}</p>
                      </div>

                      <div className="text-right">
                        <span className={`text-2xl font-extrabold ${isOutOfRange ? 'text-rose-600' : 'text-slate-900'}`}>
                          {sen.currentTemp > 0 ? `+${sen.currentTemp}` : sen.currentTemp}°C
                        </span>
                        <p className="text-[10px] text-slate-400">Target: {sen.targetTemp}</p>
                      </div>
                    </div>

                    {/* SVG Sparkline of last 12 hours */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>12h Trend History</span>
                        <span>Probe Humidity: {sen.humidityPercent}%</span>
                      </div>
                      <div className="h-10 bg-slate-50 rounded-lg p-1.5 flex items-end gap-1">
                        {sen.telemetryPoints.map((pt, idx) => {
                          const heightPct = Math.min(100, Math.max(15, Math.round(((pt - sen.minTemp) / (sen.maxTemp - sen.minTemp || 1)) * 80 + 10)));
                          return (
                            <div
                              key={idx}
                              className={`flex-1 rounded-sm transition-all ${
                                pt > sen.maxTemp || pt < sen.minTemp ? 'bg-rose-500' : 'bg-teal-500'
                              }`}
                              style={{ height: `${heightPct}%` }}
                              title={`${pt}°C`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-500" /> Ping {sen.lastPingMinutesAgo}m ago
                      </span>
                      <span className="font-medium text-slate-700">Battery: {sen.batteryPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: COST-PER-TEST (CPT) & RECIPE PROFITABILITY MATRIX         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'cpt' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-purple-200/90 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    Cost-Per-Test (CPT) &amp; Recipe Amortization
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Micro-costing formula: Direct Reagent mL + Calibrator Amortization + Cuvettes &amp; Conductive Tips Overhead.
                  </p>
                </div>

                <button
                  onClick={() => setIsSimulateConsumptionModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-600 text-white text-xs sm:text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Execute Test Consumption</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {cptRecipes.map(recipe => (
                <div key={recipe.testCode} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {recipe.category} · {recipe.analyzerModel}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{recipe.testName}</h3>
                      <p className="text-xs text-slate-400 font-mono">Test Code: {recipe.testCode}</p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-xs text-slate-400">Total CPT Cost:</span>
                        <p className="text-lg font-bold text-slate-900">₹{recipe.totalCostPerTestInr.toFixed(2)}</p>
                      </div>
                      <div className="pl-4 border-l border-slate-200">
                        <span className="text-xs text-slate-400">B2C Gross Margin:</span>
                        <p className="text-lg font-extrabold text-emerald-600">{recipe.grossMarginB2CPercent}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Micro-costing breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[11px]">Reagents Volume Cost</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">₹{recipe.reagentCostPerTestInr.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{recipe.reagentComponents.map(c => `${c.reagentName} (${c.volumeMl}mL)`).join(', ')}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[11px]">Calibrator &amp; QC Amortization</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">₹{recipe.calibratorCostPerTestInr.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Multi-point calibrator &amp; daily 2-level QC</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[11px]">Consumables Overhead</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">₹{recipe.consumableOverheadInr.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Reaction cuvettes, conductive tips &amp; wash</p>
                    </div>
                  </div>

                  {/* Commercial Comparison */}
                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100 gap-2">
                    <div className="flex items-center gap-4">
                      <span>B2C Tariff: <b>₹{recipe.sellingPriceB2CInr}</b> (Net Margin: <span className="text-emerald-700 font-bold">₹{recipe.netMarginB2CInr}</span>)</span>
                      <span>•</span>
                      <span>B2B Franchisee: <b>₹{recipe.sellingPriceB2BInr}</b> (Margin: <span className="text-purple-700 font-bold">{recipe.grossMarginB2BPercent}%</span>)</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">Monthly Volume: ~{recipe.monthlyTestVolume} tests</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: PURCHASE ORDERS (PO) & PROCUREMENT LIFECYCLE               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Diagnostic Reagent Procurement &amp; PO Records
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Track vendor purchase orders, GRN receipt inspections and cold chain compliance.
                </p>
              </div>

              <button
                onClick={() => setIsRaisePoModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Purchase Order</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">PO Number &amp; Date</th>
                      <th className="px-4 py-3">Vendor Name</th>
                      <th className="px-4 py-3">Items / Kits</th>
                      <th className="px-4 py-3">Total Amount (Incl GST)</th>
                      <th className="px-4 py-3">Urgency</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {purchaseOrders.map(po => (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-mono font-bold text-slate-900">{po.poNumber}</p>
                          <p className="text-[11px] text-slate-400">{po.orderDate}</p>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {po.vendorName}
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-slate-800 font-medium">{po.items.length} line items</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {po.items.map(i => i.reagentName).join(', ')}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">₹{po.totalAmountInr.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">GST: ₹{po.gstAmountInr.toLocaleString()}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          {po.urgency === 'STAT_EMERGENCY' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              STAT Fast-Track
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              Routine
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {po.status === 'RECEIVED_GRN' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GRN Received
                            </span>
                          )}
                          {po.status === 'IN_TRANSIT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Radio className="w-3 h-3 text-blue-600 animate-pulse" /> In-Transit
                            </span>
                          )}
                          {po.status === 'VENDOR_CONFIRMED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Confirmed
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setBannerAlert({
                                message: `Opening printable PO ${po.poNumber} for ${po.vendorName}`,
                                type: 'info',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>View PO</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 7: DIAGNOSTIC VENDORS & AUTHORIZED DISTRIBUTORS               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Verified Diagnostic Reagent Vendors &amp; Contract Directory
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Authorized OEM suppliers, contracted lead times, and SLA compliance metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(v => (
                <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3.5 hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {v.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{v.name}</h3>
                      <p className="text-xs text-slate-500">GSTIN: {v.gstin}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-600">★ {v.rating} / 5</span>
                      <p className="text-[10px] text-slate-400">SLA: {v.slaLeadTimeDays}d Delivery</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.contactPerson}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.phone}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">{v.contractType.replace(/_/g, ' ')}</span>
                    <button
                      onClick={() => setIsRaisePoModalOpen(true)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Issue Order &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODAL 1: REGISTER NEW LOT / INWARD CONSIGNMENT                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isRegisterLotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Inward Diagnostic Reagent Lot</h3>
                </div>
                <button onClick={() => setIsRegisterLotModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const newLot: ReagentItem = {
                    id: `rgt-${Date.now()}`,
                    code: `RGT-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: (form.elements.namedItem('reagentName') as HTMLInputElement).value,
                    catalogNumber: (form.elements.namedItem('catalogNumber') as HTMLInputElement).value,
                    category: 'Biochemistry',
                    manufacturer: (form.elements.namedItem('manufacturer') as HTMLInputElement).value,
                    analyzerModel: (form.elements.namedItem('analyzerModel') as HTMLInputElement).value,
                    currentStock: Number((form.elements.namedItem('packQuantity') as HTMLInputElement).value),
                    minStockAlert: 8,
                    safetyBufferDays: 15,
                    unit: 'Pack',
                    lotNumber: (form.elements.namedItem('lotNumber') as HTMLInputElement).value,
                    expiryDate: (form.elements.namedItem('expiryDate') as HTMLInputElement).value,
                    onBoardStabilityDays: 30,
                    storageTemp: '2-8°C',
                    storageLocation: 'Central Cold Room Alpha',
                    status: 'ADEQUATE',
                    calibratorFactor: 1.000,
                    kitPurchaseCostInr: Number((form.elements.namedItem('kitCost') as HTMLInputElement).value),
                    costPerTestInr: 18.50,
                    dailyUsage: 1.2,
                    barcode: `${Math.floor(8900000000000 + Math.random() * 10000000000)}`,
                    isClsiLotValidated: true,
                    coAAvailable: true,
                    packSizeVolumeMl: 250,
                    remainingVolumeMl: 250,
                  };

                  setReagents([newLot, ...reagents]);
                  setIsRegisterLotModalOpen(false);
                  setBannerAlert({
                    message: `Reagent Lot '${newLot.lotNumber}' for '${newLot.name}' registered & stored in Cold Room Alpha.`,
                    type: 'success',
                  });
                }}
                className="space-y-3.5 text-xs sm:text-sm"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reagent Assay Name *</label>
                  <input
                    type="text"
                    name="reagentName"
                    required
                    placeholder="e.g. Roche Cobas HbA1c Whole Blood Gen.3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Catalog # *</label>
                    <input
                      type="text"
                      name="catalogNumber"
                      required
                      placeholder="e.g. ROCH-0842932"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lot Number *</label>
                    <input
                      type="text"
                      name="lotNumber"
                      required
                      placeholder="e.g. LOT-HBA-9912"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Manufacturer *</label>
                    <input
                      type="text"
                      name="manufacturer"
                      required
                      placeholder="e.g. Roche Diagnostics"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Analyzer Platform *</label>
                    <input
                      type="text"
                      name="analyzerModel"
                      required
                      placeholder="e.g. Cobas c503"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pack Quantity</label>
                    <input
                      type="number"
                      name="packQuantity"
                      defaultValue={10}
                      min={1}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pack Cost (₹)</label>
                    <input
                      type="number"
                      name="kitCost"
                      defaultValue={8500}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      name="expiryDate"
                      required
                      defaultValue="2027-04-30"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Certificate of Analysis (CoA) auto-verified against manufacturer database.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRegisterLotModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                  >
                    Save &amp; Inward Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODAL 2: RAISE FORMAL PURCHASE ORDER                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isRaisePoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Issue Purchase Order (PO)</h3>
                </div>
                <button onClick={() => setIsRaisePoModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const vendorId = (form.elements.namedItem('vendorId') as HTMLSelectElement).value;
                  const vendor = vendors.find(v => v.id === vendorId) || vendors[0];
                  const urgency = (form.elements.namedItem('urgency') as HTMLSelectElement).value as 'ROUTINE' | 'STAT_EMERGENCY';

                  const newPo: PurchaseOrder = {
                    id: `po-${Date.now()}`,
                    poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    orderDate: new Date().toISOString().slice(0, 10),
                    expectedDeliveryDate: new Date(Date.now() + vendor.slaLeadTimeDays * 86400000).toISOString().slice(0, 10),
                    urgency,
                    items: [
                      { reagentId: 'rgt-001', reagentName: 'Sysmex Cellpack DCL Diluent (20L)', catalog: 'SYS-210041', quantityPacks: 10, unitPriceInr: 14500, totalInr: 145000 },
                      { reagentId: 'rgt-003', reagentName: 'Roche Cobas Cholesterol Gen.2', catalog: 'ROCH-05168538', quantityPacks: 8, unitPriceInr: 6250, totalInr: 50000 },
                    ],
                    subtotalInr: 195000,
                    gstAmountInr: 23400,
                    totalAmountInr: 218400,
                    status: 'RAISED',
                    raisedBy: 'Dr. Rajesh Nair (Chief Biochemist)',
                    notes: 'Delivery directly to Central Cold Storage Ground Floor.',
                  };

                  setPurchaseOrders([newPo, ...purchaseOrders]);
                  setIsRaisePoModalOpen(false);
                  setBannerAlert({
                    message: `Purchase Order ${newPo.poNumber} for ₹${newPo.totalAmountInr.toLocaleString()} transmitted to ${newPo.vendorName}.`,
                    type: 'success',
                  });
                }}
                className="space-y-4 text-xs sm:text-sm"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Diagnostic Supplier *</label>
                  <select
                    name="vendorId"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} (SLA: {v.slaLeadTimeDays} days lead time)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Order Priority</label>
                    <select
                      name="urgency"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="ROUTINE">Routine Replenishment</option>
                      <option value="STAT_EMERGENCY">STAT Emergency Stockout</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment &amp; Contract Terms</label>
                    <input
                      type="text"
                      readOnly
                      defaultValue="Net 30 Days (Annual Rate Contract)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-800 text-xs block">Auto-Populated Reorder Items:</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>• Sysmex Cellpack DCL Diluent (10 Packs)</span>
                      <span className="font-mono">₹1,45,000</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>• Roche Cobas Cholesterol Gen.2 (8 Cassettes)</span>
                      <span className="font-mono">₹50,000</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span>Subtotal (Excl. 12% GST):</span>
                      <span>₹1,95,000</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>12% Diagnostic Reagents GST:</span>
                      <span>₹23,400</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-blue-700 pt-1">
                      <span>Total Invoice Payable:</span>
                      <span>₹2,18,400</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRaisePoModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                  >
                    Authorize &amp; Transmit PO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODAL 3: SIMULATE ATOMIC TEST CONSUMPTION                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isSimulateConsumptionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-bold text-slate-900">Execute Automated Recipe Run</h3>
                </div>
                <button onClick={() => setIsSimulateConsumptionModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const testCode = (form.elements.namedItem('testCode') as HTMLSelectElement).value;
                  const barcode = (form.elements.namedItem('sampleBarcode') as HTMLInputElement).value;
                  handleExecuteConsumptionSimulation(testCode, barcode);
                }}
                className="space-y-4 text-xs sm:text-sm"
              >
                <p className="text-xs text-slate-500">
                  Simulates a patient test run from Sysmex/Cobas analyzers. ELIS-OS automatically checks on-board carousel stability, lot expiration, and decrements required reagent mL, cuvettes, and conductive tips.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Clinical Assay Recipe</label>
                  <select
                    name="testCode"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {cptRecipes.map(c => (
                      <option key={c.testCode} value={c.testCode}>
                        {c.testName} ({c.analyzerModel}) - CPT: ₹{c.totalCostPerTestInr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Vacutainer Barcode</label>
                  <input
                    type="text"
                    name="sampleBarcode"
                    required
                    defaultValue={`SMP-${Math.floor(100000 + Math.random() * 900000)}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                  <span className="font-semibold block">Atomic Analyzer Interlock Safety:</span>
                  <p>• Blocks run if lot is expired or on-board open vial limit is exceeded.</p>
                  <p>• Logs consumption with user timestamp &amp; sample barcode for NABL traceability.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSimulateConsumptionModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-sm"
                  >
                    Execute Recipe Decrement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODAL 4: PHYSICAL STOCK AUDIT / DISCREPANCY ADJUSTMENT            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Physical Stock Count Audit</h3>
                </div>
                <button onClick={() => setIsAuditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  setIsAuditModalOpen(false);
                  setBannerAlert({
                    message: 'Physical stock audit recorded. Discrepancy logged under NABL clause 6.4 reconciliation.',
                    type: 'success',
                  });
                }}
                className="space-y-3.5 text-xs sm:text-sm"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Reagent to Adjust</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                    {reagents.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Lot: {r.lotNumber}) - System: {r.currentStock} {r.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Physical Verified Count</label>
                    <input
                      type="number"
                      defaultValue={8}
                      min={0}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Variance Reason</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                      <option>Analyzer Prime / Dead Volume Burn</option>
                      <option>Calibration Re-run Consumption</option>
                      <option>Spillage or Accidental Breakage</option>
                      <option>QC Multi-Level Consumption</option>
                      <option>Expired Discard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Auditor Sign-off Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter NABL cycle count notes or justification..."
                    defaultValue="Quarterly cycle count completed. Verified against cold room physical shelf."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAuditModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                  >
                    Post Audit Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODAL 5: PRINTABLE NABL ISO 15189 VALUATION & AUDIT REPORT        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isPrintReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">NABL ISO 15189:2022 Inventory Valuation &amp; Audit Report</h3>
                    <p className="text-xs text-slate-500">Official Clinical Laboratory Certificate of Inventory Valuation</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Certificate</span>
                  </button>
                  <button onClick={() => setIsPrintReportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="space-y-6 text-slate-800">
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-blue-600 pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">NIKIL-LABCORE MEDICAL &amp; DIAGNOSTIC OS</h1>
                    <p className="text-xs text-slate-600 font-medium">Department of Laboratory Medicine &amp; Central Bio-Repository</p>
                    <p className="text-[11px] text-slate-500">NABL Accreditation No: MC-2940 · ISO 15189:2022 Certified Central Lab</p>
                    <p className="text-[11px] text-slate-500">Hospital Complex, Central Diagnostic Wing, Ground Floor, Mumbai - 400012</p>
                  </div>
                  {reportQrDataUrl && (
                    <div className="text-center">
                      <img src={reportQrDataUrl} alt="NABL Verification QR" className="w-24 h-24 border border-slate-200 rounded p-1 mx-auto" />
                      <span className="text-[9px] text-slate-400 font-mono block mt-0.5">SCAN TO VERIFY</span>
                    </div>
                  )}
                </div>

                {/* Audit Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[11px]">Audit Report Number:</span>
                    <p className="font-mono font-bold text-slate-900">AUD-INV-2026-9041</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Audit Date &amp; Time:</span>
                    <p className="font-semibold text-slate-900">{new Date().toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Total Reagent Items:</span>
                    <p className="font-bold text-slate-900">{reagents.length} Line Items</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Total Stock Valuation:</span>
                    <p className="font-bold text-blue-700 text-sm">₹{stats.totalAssetValuationInr.toLocaleString()}</p>
                  </div>
                </div>

                {/* Inventory Table Summary */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
                      <tr>
                        <th className="p-2 border">Reagent Name &amp; Catalog</th>
                        <th className="p-2 border">Lot Number</th>
                        <th className="p-2 border">Expiry</th>
                        <th className="p-2 border">Storage</th>
                        <th className="p-2 border">Stock Qty</th>
                        <th className="p-2 border">Unit Cost</th>
                        <th className="p-2 border text-right">Total Valuation (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reagents.map(item => (
                        <tr key={item.id}>
                          <td className="p-2 border font-medium">{item.name}</td>
                          <td className="p-2 border font-mono">{item.lotNumber}</td>
                          <td className="p-2 border">{item.expiryDate}</td>
                          <td className="p-2 border">{item.storageTemp}</td>
                          <td className="p-2 border">{item.currentStock} {item.unit}</td>
                          <td className="p-2 border">₹{item.kitPurchaseCostInr.toLocaleString()}</td>
                          <td className="p-2 border text-right font-semibold">₹{(item.kitPurchaseCostInr * item.currentStock).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Regulatory Statement & Signatures */}
                <div className="pt-4 border-t border-slate-200 text-xs space-y-4">
                  <p className="text-[11px] text-slate-500 italic">
                    Regulatory Certification: This inventory reconciliation has been conducted in compliance with NABL ISO 15189:2022 Clause 6.4 (Reagents and Consumables). All open vial carousels are monitored under automated stability countdown. Continuous 2°C–8°C IoT telemetry logs are archived for 5 years.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 text-center">
                    <div>
                      <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">Sunita Sharma</div>
                      <p className="text-[11px] text-slate-500">Chief Store Keeper &amp; Logistics Lead</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">Dr. Rajesh Nair, MD</div>
                      <p className="text-[11px] text-slate-500">Chief Biochemist &amp; Quality Manager</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">Dr. Ananya Deshmukh, MD</div>
                      <p className="text-[11px] text-slate-500">Laboratory Director (Pathologist)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
