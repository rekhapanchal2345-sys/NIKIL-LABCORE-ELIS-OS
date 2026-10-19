'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
    DataProvenance,
    EnterpriseAnalyzerTelemetry,
    HospitalFacilityId,
    EmergencyStatCode,
    NexusTab,
    ControlledAutonomyProposal,
    DeltaCheckAlert,
    ReagentInventoryAdvisory,
    LiveSpecimenCarrier,
    QueueProcessAnalytics,
    FacilityProfile,
    BiomedicalWorkOrder,
    UvCDecontaminationRecord,
} from './nexus.contracts';


// =========================================================================
// TYPES & CONTRACTS
// =========================================================================

export type DomainPillarId = 1 | 2 | 3 | 4 | 5;

export interface AuditTrailEntry {
    id: string;
    proposalId: string;
    proposalTitle: string;
    decision: 'APPROVED_EXECUTED' | 'REJECTED';
    role: string;
    reviewerName: string;
    timestamp: string;
    digitalSignature: string;
    notes: string;
}

export interface ClinicalCommLogEntry {
    alertId: string;
    analyteName: string;
    note: string;
    timestamp: string;
    clinicianRole: string;
    status: 'ACKNOWLEDGED_BY_CLINICIAN';
}

export interface PurchaseOrderRecord {
    poNumber: string;
    reagentId: string;
    reagentName: string;
    analyzerName: string;
    quantityPacks: number;
    unitPriceUsd: number;
    totalAmountUsd: number;
    status: 'PO_GENERATED_DISPATCHED' | 'ERP_SYNCED' | 'DELIVERED';
    timestamp: string;
    expectedDeliveryDays: number;
}

export interface ParetoPolicyOption {
    id: 'BALANCED_CLINICAL' | 'AGGRESSIVE_STAT' | 'REAGENT_CONSERVATIVE';
    title: string;
    description: string;
    medianTatMinutes: number;
    thermalDriftRiskPct: number;
    operatingCostPerSample: number;
    statQueueWaitMinutes: number;
}

export interface NexusState {
    activeDomain: DomainPillarId;
    activeTab: NexusTab;
    activeRole: 'LAB_DIRECTOR' | 'PATHOLOGIST' | 'LAB_TECHNICIAN';
    activeFacility: HospitalFacilityId;
    emergencyCode: EmergencyStatCode;
    isSoundMuted: boolean;
    searchBarcode: string;
    isAuditModalOpen: boolean;

    // Core Domain Datasets
    facilities: Record<HospitalFacilityId, FacilityProfile>;
    workOrders: BiomedicalWorkOrder[];
    uvcCycle: UvCDecontaminationRecord;
    isHl7LiveStreaming: boolean;
    fleet: EnterpriseAnalyzerTelemetry[];
    departmentQueues: QueueProcessAnalytics[];
    proposals: ControlledAutonomyProposal[];
    auditTrail: AuditTrailEntry[];
    deltaCheckAlerts: DeltaCheckAlert[];
    clinicalCommLogs: ClinicalCommLogEntry[];
    reagentAlerts: ReagentInventoryAdvisory[];
    purchaseOrders: PurchaseOrderRecord[];
    liveSpecimens: LiveSpecimenCarrier[];
    paretoPolicy: 'BALANCED_CLINICAL' | 'AGGRESSIVE_STAT' | 'REAGENT_CONSERVATIVE';

    // Interactive Pre-Analytics HIL State
    hilSimulator: {
        analyteCode: string;
        hemolysisMgDl: number;
        icterusMgDl: number;
        lipemiaTurbidity: number;
        calculatedBiasPct: number;
        clsiAction: 'CLEAR_AUTOVERIFIED' | 'FLAG_INTERPRETIVE_NOTE' | 'AUTOVERIFICATION_BLOCKED_REJECT';
        clinicalAdvisoryText: string;
    };

    // Rollup KPIs
    kpis: {
        dailyAccessions: number;
        medianTatMinutes: number;
        predictedSlaBreachPct: number;
        fleetAvailabilityPct: number;
        activeAnalyzersCount: number;
        totalAnalyzersCount: number;
        westgardViolationsCount: number;
    };
}

export interface NexusStoreActions {
    setActiveDomain: (domain: DomainPillarId) => void;
    setActiveTab: (tab: NexusTab) => void;
    setActiveRole: (role: 'LAB_DIRECTOR' | 'PATHOLOGIST' | 'LAB_TECHNICIAN') => void;
    setActiveFacility: (facility: HospitalFacilityId) => void;
    setEmergencyCode: (code: EmergencyStatCode) => void;
    toggleSoundMuted: () => void;
    setSearchBarcode: (barcode: string) => void;
    setIsAuditModalOpen: (open: boolean) => void;

    // Interactive Real-World Hospital Actions
    authorizeProposal: (proposalId: string, notes?: string) => { success: boolean; message: string };
    rejectProposal: (proposalId: string, notes?: string) => { success: boolean; message: string };
    scheduleRecalibration: (analyzerId: string) => void;
    acknowledgeDeltaCheck: (alertId: string, clinicalNote: string) => void;
    generatePurchaseOrder: (reagentId: string) => PurchaseOrderRecord;
    setParetoPolicy: (policy: 'BALANCED_CLINICAL' | 'AGGRESSIVE_STAT' | 'REAGENT_CONSERVATIVE') => void;
    updateHilSimulator: (params: { analyteCode?: string; hemolysis?: number; icterus?: number; lipemia?: number }) => void;
    triggerSpecimenRerun: (sampleBarcode: string, actionType: 'REDRAW' | 'DILUTE_ULTRACENTRIFUGE') => void;
    triggerUvcDecontamination: () => void;
    injectStatSpecimen: (specimenData?: Partial<LiveSpecimenCarrier>) => LiveSpecimenCarrier;
    launchPneumaticCapsule: (origin: string, dest: string, priority?: 'STAT_EMERGENCY' | 'URGENT' | 'ROUTINE') => void;
    dispatchWorkOrder: (analyzerId: string, taskTitle: string, priority?: 'EMERGENCY_STAT' | 'HIGH' | 'ROUTINE') => BiomedicalWorkOrder;
    toggleHl7Stream: () => void;
}


export const DOMAIN_PILLARS = [
    {
        id: 1 as DomainPillarId,
        title: 'Command & Spatial TLA',
        subtitle: 'Mission Control, 2D/3D Floor Twin & Specimen Tracker',
        tabs: [
            { id: 'OVERVIEW' as NexusTab, label: 'Mission Control', short: 'Overview' },
            { id: 'WORLD_MODEL' as NexusTab, label: '2D/3D Floor Twin', short: '3D Floor' },
            { id: 'SPECIMEN_TRACKER' as NexusTab, label: 'Specimen Radar', short: 'Specimens' },
        ],
    },
    {
        id: 2 as DomainPillarId,
        title: 'Fleet, Supply & Operations',
        subtitle: '6-Analyzer Fleet, Queueing Theory & Reagent PO Radar',
        tabs: [
            { id: 'FLEET_TELEMETRY' as NexusTab, label: 'Fleet Telemetry', short: 'Fleet' },
            { id: 'QUEUES' as NexusTab, label: "Queueing & Little's Law", short: 'Queues' },
            { id: 'INVENTORY' as NexusTab, label: 'Reagent Stockout Radar', short: 'Supplies' },
        ],
    },
    {
        id: 3 as DomainPillarId,
        title: 'Analytical Quality & Pre-Analytics',
        subtitle: 'Levey-Jennings, CUSUM, HIL CLSI EP07-A2 & Arrhenius',
        tabs: [
            { id: 'QUALITY' as NexusTab, label: 'Levey-Jennings & CUSUM', short: 'QC Drift' },
            { id: 'HIL_RADAR' as NexusTab, label: 'HIL Interference', short: 'HIL Radar' },
            { id: 'STABILITY' as NexusTab, label: 'Arrhenius Bio-Stability', short: 'Stability' },
        ],
    },
    {
        id: 4 as DomainPillarId,
        title: 'Clinical Safety & Autonomous Adjudication',
        subtitle: 'Delta-Checks, Human-in-the-Loop Failover & Causal RCA',
        tabs: [
            { id: 'DELTA_CHECKS' as NexusTab, label: 'Delta-Check Watch', short: 'Delta Alert' },
            { id: 'AUTONOMY' as NexusTab, label: 'Controlled Autonomy', short: 'Autonomy' },
            { id: 'INVESTIGATIONS' as NexusTab, label: 'Causal Evidence Graph', short: 'Causal RCA' },
        ],
    },
    {
        id: 5 as DomainPillarId,
        title: 'Optimization, AI Governance & Sandbox',
        subtitle: 'NSGA-II Pareto Frontier, Hyperion SaMD & Math Workbench',
        tabs: [
            { id: 'PARETO' as NexusTab, label: 'Pareto Frontier', short: 'Pareto' },
            { id: 'MODELS' as NexusTab, label: 'Hyperion Governance', short: 'AI Models' },
            { id: 'MATH' as NexusTab, label: 'Mathematical Sandbox', short: 'Math Lab' },
        ],
    },
];

// Initial calibrated baseline fleet
const INITIAL_FLEET: EnterpriseAnalyzerTelemetry[] = [
    {
        analyzerId: 'ANZ-BIO-01',
        name: 'Roche Cobas Pro c503 #1',
        manufacturer: 'Roche Diagnostics',
        model: 'Cobas Pro c503',
        serialNumber: 'SN-CB503-9941',
        department: 'BIOCHEMISTRY',
        status: 'LOCKED_WESTGARD_VIOLATION',
        throughputNominalPerHour: 160,
        currentThroughputRealtime: 0,
        currentQueueDepth: 48,
        carouselRacksInProcess: 0,
        opticalLampHours: 1420,
        vacuumPressureKpa: -84.2,
        chamberTemperatureCelsius: 37.1,
        failureHazardRateH: 0.0142,
        rulHours: 32.5,
        lastCalibrationTime: '2026-10-15T08:00:00Z',
        lastQcStatus: 'FAILED_WESTGARD_2_2S',
        reagentPacks: [
            { name: 'ISE Electrolyte Pack', lot: 'LOT-K-8842', testsRemaining: 340, lowThreshold: 400, expiry: '2026-11-30' },
            { name: 'Enzymatic Creatinine Gen.2', lot: 'LOT-CR-901', testsRemaining: 780, lowThreshold: 200, expiry: '2027-01-15' },
        ],
    },
    {
        analyzerId: 'ANZ-BIO-02',
        name: 'Roche Cobas Pro c503 #2 (Backup / STAT)',
        manufacturer: 'Roche Diagnostics',
        model: 'Cobas Pro c503',
        serialNumber: 'SN-CB503-9942',
        department: 'BIOCHEMISTRY',
        status: 'ONLINE',
        throughputNominalPerHour: 160,
        currentThroughputRealtime: 145,
        currentQueueDepth: 18,
        carouselRacksInProcess: 3,
        opticalLampHours: 620,
        vacuumPressureKpa: -85.0,
        chamberTemperatureCelsius: 37.0,
        failureHazardRateH: 0.0031,
        rulHours: 340.0,
        lastCalibrationTime: '2026-10-16T04:00:00Z',
        lastQcStatus: 'PASSED_IN_CONTROL',
        reagentPacks: [
            { name: 'ISE Electrolyte Pack', lot: 'LOT-K-9901', testsRemaining: 890, lowThreshold: 400, expiry: '2027-02-28' },
            { name: 'Enzymatic Creatinine Gen.2', lot: 'LOT-CR-902', testsRemaining: 920, lowThreshold: 200, expiry: '2027-03-31' },
        ],
    },
    {
        analyzerId: 'ANZ-HEM-01',
        name: 'Sysmex XN-1000 Core Automated Cell Counter',
        manufacturer: 'Sysmex Corporation',
        model: 'XN-1000',
        serialNumber: 'SN-XN10-4491',
        department: 'HEMATOLOGY',
        status: 'ONLINE',
        throughputNominalPerHour: 100,
        currentThroughputRealtime: 92,
        currentQueueDepth: 28,
        carouselRacksInProcess: 4,
        opticalLampHours: 890,
        vacuumPressureKpa: -62.4,
        chamberTemperatureCelsius: 24.2,
        failureHazardRateH: 0.0042,
        rulHours: 280.0,
        lastCalibrationTime: '2026-10-16T00:00:00Z',
        lastQcStatus: 'PASSED_IN_CONTROL',
        reagentPacks: [
            { name: 'CELLPACK DCL Diluent & Lyse', lot: 'LOT-CP-901', testsRemaining: 640, lowThreshold: 200, expiry: '2027-04-30' },
            { name: 'Fluorocell WNR Dye', lot: 'LOT-FC-112', testsRemaining: 410, lowThreshold: 150, expiry: '2026-12-31' },
        ],
    },
    {
        analyzerId: 'ANZ-IMM-01',
        name: 'Abbott ARCHITECT i2000SR Chemiluminescence',
        manufacturer: 'Abbott Laboratories',
        model: 'ARCHITECT i2000SR',
        serialNumber: 'SN-ARC2K-1120',
        department: 'IMMUNOASSAY',
        status: 'ONLINE',
        throughputNominalPerHour: 200,
        currentThroughputRealtime: 180,
        currentQueueDepth: 14,
        carouselRacksInProcess: 2,
        opticalLampHours: 420,
        vacuumPressureKpa: -88.0,
        chamberTemperatureCelsius: 37.0,
        failureHazardRateH: 0.0022,
        rulHours: 450.0,
        lastCalibrationTime: '2026-10-15T18:00:00Z',
        lastQcStatus: 'PASSED_IN_CONTROL',
        reagentPacks: [
            { name: 'STAT High Sensitivity Troponin-I', lot: 'LOT-TRP-202', testsRemaining: 190, lowThreshold: 200, expiry: '2026-12-15' },
            { name: 'Procalcitonin (PCT) Chemiluminescence', lot: 'LOT-PCT-303', testsRemaining: 310, lowThreshold: 100, expiry: '2027-02-15' },
        ],
    },
    {
        analyzerId: 'ANZ-COAG-01',
        name: 'Diagnostica Stago STA R Max Hemostasis',
        manufacturer: 'Diagnostica Stago',
        model: 'STA R Max 3',
        serialNumber: 'SN-STA-7714',
        department: 'COAGULATION',
        status: 'ONLINE',
        throughputNominalPerHour: 120,
        currentThroughputRealtime: 110,
        currentQueueDepth: 12,
        carouselRacksInProcess: 2,
        opticalLampHours: 310,
        vacuumPressureKpa: -80.0,
        chamberTemperatureCelsius: 37.0,
        failureHazardRateH: 0.0018,
        rulHours: 520.0,
        lastCalibrationTime: '2026-10-16T06:00:00Z',
        lastQcStatus: 'PASSED_IN_CONTROL',
        reagentPacks: [
            { name: 'STA-Neoplastine Clot Reagent', lot: 'LOT-PT-505', testsRemaining: 420, lowThreshold: 150, expiry: '2027-01-20' },
            { name: 'STA-Liquid Anti-Xa', lot: 'LOT-AXA-601', testsRemaining: 280, lowThreshold: 80, expiry: '2027-03-10' },
        ],
    },
    {
        analyzerId: 'ANZ-MICRO-01',
        name: 'bioMérieux BACT/ALERT 3D Microbial Detection',
        manufacturer: 'bioMérieux',
        model: 'BACT/ALERT VIRTUO',
        serialNumber: 'SN-VIRTUO-900',
        department: 'MICROBIOLOGY',
        status: 'ONLINE',
        throughputNominalPerHour: 30,
        currentThroughputRealtime: 24,
        currentQueueDepth: 6,
        carouselRacksInProcess: 1,
        opticalLampHours: 1100,
        vacuumPressureKpa: -70.0,
        chamberTemperatureCelsius: 36.5,
        failureHazardRateH: 0.0029,
        rulHours: 390.0,
        lastCalibrationTime: '2026-10-14T12:00:00Z',
        lastQcStatus: 'PASSED_IN_CONTROL',
        reagentPacks: [
            { name: 'BACT/ALERT FA Plus Aerobic Media', lot: 'LOT-BC-441', testsRemaining: 280, lowThreshold: 100, expiry: '2027-03-31' },
            { name: 'BACT/ALERT FN Plus Anaerobic Media', lot: 'LOT-BC-442', testsRemaining: 260, lowThreshold: 100, expiry: '2027-03-31' },
        ],
    },
];

// Initial department queues
const INITIAL_QUEUES: QueueProcessAnalytics[] = [
    { department: 'HEMATOLOGY', activeChannels: 2, arrivalRateLambdaPerHour: 145, serviceRateMuPerHour: 80, trafficIntensityRho: 0.725, workInProgressL: 28.0, queueLengthLq: 8.2, erlangCWaitProbability: 0.08, meanWaitTimeWqMinutes: 4.2, meanTotalTatWMinutes: 38.5, slaTargetMinutes: 45, predictedSlaBreachRatePct: 2.1, bottleneckSeverity: 'OPTIMAL', provenance: 'LIVE' },
    { department: 'BIOCHEMISTRY', activeChannels: 3, arrivalRateLambdaPerHour: 210, serviceRateMuPerHour: 75, trafficIntensityRho: 0.933, workInProgressL: 54.0, queueLengthLq: 22.4, erlangCWaitProbability: 0.48, meanWaitTimeWqMinutes: 15.1, meanTotalTatWMinutes: 52.4, slaTargetMinutes: 60, predictedSlaBreachRatePct: 18.4, bottleneckSeverity: 'CRITICAL_SATURATION', provenance: 'LIVE' },
    { department: 'IMMUNOASSAY', activeChannels: 2, arrivalRateLambdaPerHour: 85, serviceRateMuPerHour: 45, trafficIntensityRho: 0.620, workInProgressL: 22.0, queueLengthLq: 5.1, erlangCWaitProbability: 0.05, meanWaitTimeWqMinutes: 3.5, meanTotalTatWMinutes: 44.0, slaTargetMinutes: 75, predictedSlaBreachRatePct: 1.4, bottleneckSeverity: 'OPTIMAL', provenance: 'LIVE' },
    { department: 'COAGULATION', activeChannels: 1, arrivalRateLambdaPerHour: 52, serviceRateMuPerHour: 60, trafficIntensityRho: 0.650, workInProgressL: 18.0, queueLengthLq: 4.8, erlangCWaitProbability: 0.12, meanWaitTimeWqMinutes: 6.2, meanTotalTatWMinutes: 36.5, slaTargetMinutes: 45, predictedSlaBreachRatePct: 3.2, bottleneckSeverity: 'OPTIMAL', provenance: 'LIVE' },
    { department: 'MICROBIOLOGY', activeChannels: 2, arrivalRateLambdaPerHour: 28, serviceRateMuPerHour: 16, trafficIntensityRho: 0.550, workInProgressL: 14.0, queueLengthLq: 2.1, erlangCWaitProbability: 0.02, meanWaitTimeWqMinutes: 2.8, meanTotalTatWMinutes: 98.0, slaTargetMinutes: 120, predictedSlaBreachRatePct: 0.8, bottleneckSeverity: 'OPTIMAL', provenance: 'LIVE' },
];

const INITIAL_PROPOSALS: ControlledAutonomyProposal[] = [
    {
        id: 'PROP-2026-001',
        category: 'FAILOVER_REROUTING',
        title: 'Reroute 42 Biochemistry Routine Samples from Cobas #1 to Cobas #2',
        reason: 'Cobas #1 ISE systematic shift violation (+2.42σ, Westgard 2_2s). Prevents 38m SLA breach and protects diagnostic validity.',
        supportingEvidence: [
            'ISE Na+/K+ electrode drift +2.42σ (Westgard 2_2s trigger)',
            'Secondary Cobas #2 has 680 tests reagent headroom and 0.4% bias delta',
        ],
        expectedBenefit: 'Reduces Biochemistry queue wait from 15.1m to 4.2m. Cuts SLA breach risk from 18.4% to 1.2%.',
        potentialRisk: 'Transient queue depth elevation on Cobas #2 by 12% for 25 minutes.',
        proposedAction: 'Execute split-routing manifest via automated track switch and quarantine Cobas #1 for 2-point recalibration.',
        riskLevel: 'HIGH_CLINICAL_GATE',
        requiredRole: 'PATHOLOGIST',
        status: 'PENDING_APPROVAL',
        department: 'BIOCHEMISTRY',
        proposedAt: '2026-10-16T17:15:00Z',
    },
    {
        id: 'PROP-2026-002',
        category: 'QUEUE_PREEMPTION',
        title: 'Preempt 4 STAT Troponin-I Samples to Emergency Immunoassay Lane',
        reason: 'Patient UHID-7729-ICU flagged with suspected STEMI. Bypasses routine thyroid rack for 0-wait urgent aspiration.',
        supportingEvidence: [
            'ICU Emergency STAT flag triggered at 17:21 IST',
            'Pre-analytical troponin degradation risk: < 45m allowable window',
        ],
        expectedBenefit: 'Reduces Troponin turnaround time by 18.5 minutes (TAT: 11.2 min vs 30 min SLA limit).',
        potentialRisk: 'Displaces 2 routine TSH samples by 6 minutes.',
        proposedAction: 'Elevate carrier priority to STAT_EMERGENCY and route directly to Abbott Architect i2000SR STAT port.',
        riskLevel: 'MEDIUM_OPERATIONAL',
        requiredRole: 'LAB_TECHNICIAN',
        status: 'PENDING_APPROVAL',
        department: 'IMMUNOASSAY',
        proposedAt: '2026-10-16T17:22:00Z',
    },
];

const INITIAL_SPECIMENS: LiveSpecimenCarrier[] = [
    {
        carrierId: 'CARRIER-101',
        barcode: 'LC-BC-901843',
        patientUhid: 'UHID-DL-2026-4001',
        tubeColor: 'LAVENDER_EDTA',
        tubeLabel: 'K2-EDTA 3mL (Lavender)',
        tests: ['Complete Blood Count (CBC)', 'Platelet Indices'],
        department: 'HEMATOLOGY',
        priority: 'STAT_EMERGENCY',
        currentZoneId: 'ZONE-HEM',
        currentZoneName: 'Core Hematology & Flow Cytometry',
        elapsedMinutes: 14.2,
        maxStabilityMinutes: 120,
        stabilityRemainingPct: 88.2,
        estimatedCompletionMinutes: 11.0,
        carrierPosition: { x: 20, y: -110, progressPct: 0.45 },
        status: 'ON_TRACK',
    },
    {
        carrierId: 'CARRIER-102',
        barcode: 'LC-BC-901844',
        patientUhid: 'UHID-DL-2026-4002',
        tubeColor: 'GOLD_SST',
        tubeLabel: 'Serum Gel SST 4mL (Gold)',
        tests: ['Renal Function Panel (K+, Creatinine)', 'Serum Electrolytes'],
        department: 'BIOCHEMISTRY',
        priority: 'ROUTINE',
        currentZoneId: 'ZONE-BIO',
        currentZoneName: 'High-Volume Clinical Biochemistry',
        elapsedMinutes: 24.5,
        maxStabilityMinutes: 180,
        stabilityRemainingPct: 86.4,
        estimatedCompletionMinutes: 16.5,
        carrierPosition: { x: -140, y: 30, progressPct: 0.22 },
        status: 'ASPIRATING',
    },
    {
        carrierId: 'CARRIER-103',
        barcode: 'LC-BC-901846',
        patientUhid: 'UHID-DL-2026-4004',
        tubeColor: 'LIGHT_BLUE_CITRATE',
        tubeLabel: 'Sodium Citrate 3.2% 2.7mL (Light Blue)',
        tests: ['Prothrombin Time (PT/INR)', 'Activated PTT (aPTT)'],
        department: 'COAGULATION',
        priority: 'STAT_EMERGENCY',
        currentZoneId: 'ZONE-COAG',
        currentZoneName: 'STAT Coagulation & Hemostasis Center',
        elapsedMinutes: 9.8,
        maxStabilityMinutes: 240,
        stabilityRemainingPct: 95.9,
        estimatedCompletionMinutes: 8.2,
        carrierPosition: { x: 120, y: 30, progressPct: 0.62 },
        status: 'ON_TRACK',
    },
    {
        carrierId: 'CARRIER-104',
        barcode: 'LC-BC-901848',
        patientUhid: 'UHID-DL-2026-4005',
        tubeColor: 'GREEN_HEPARIN',
        tubeLabel: 'Lithium Heparin 3mL (Green)',
        tests: ['STAT High-Sens Troponin-I', 'Blood Gas Electrolytes'],
        department: 'IMMUNOASSAY',
        priority: 'STAT_EMERGENCY',
        currentZoneId: 'ZONE-IMM',
        currentZoneName: 'STAT Chemiluminescence Suite',
        elapsedMinutes: 7.2,
        maxStabilityMinutes: 60,
        stabilityRemainingPct: 88.0,
        estimatedCompletionMinutes: 6.4,
        carrierPosition: { x: 20, y: 30, progressPct: 0.15 },
        status: 'ASPIRATING',
    },
    {
        carrierId: 'CARRIER-105',
        barcode: 'LC-BC-901850',
        patientUhid: 'UHID-DL-2026-4009',
        tubeColor: 'GREY_FLUORIDE',
        tubeLabel: 'Fluoride-Oxalate 2mL (Gray)',
        tests: ['Blood Lactate STAT', 'Plasma Fasting Glucose'],
        department: 'BIOCHEMISTRY',
        priority: 'STAT_EMERGENCY',
        currentZoneId: 'ZONE-ACC',
        currentZoneName: 'Phlebotomy & Sample Accessioning Hub',
        elapsedMinutes: 4.0,
        maxStabilityMinutes: 30,
        stabilityRemainingPct: 86.7,
        estimatedCompletionMinutes: 12.0,
        carrierPosition: { x: -40, y: 130, progressPct: 0.08 },
        status: 'IN_CENTRIFUGE',
    },
];

const INITIAL_REAGENTS: ReagentInventoryAdvisory[] = [
    {
        reagentId: 'RGT-BIO-ISE-01',
        reagentName: 'Roche Cobas ISE Electrolyte Reagent Pack',
        analyzerId: 'ANZ-BIO-01',
        analyzerName: 'Roche Cobas Pro c503 #1',
        department: 'BIOCHEMISTRY',
        testsRemaining: 340,
        dailyConsumptionRate: 180,
        daysOfStockRemaining: 1.8,
        safetyStockThreshold: 400,
        reorderLeadTimeDays: 2,
        stockoutRisk: 'CRITICAL_DEPLETION_RISK',
        recommendedReorderDate: '2026-10-17',
        expiryDate: '2026-11-30',
        daysToExpiry: 45,
        expiryExposureRisk: false,
        provenance: 'LIVE',
    },
    {
        reagentId: 'RGT-HEM-CBC-02',
        reagentName: 'Sysmex Cellpack DCL Diluent & Lyse (20L)',
        analyzerId: 'ANZ-HEM-01',
        analyzerName: 'Sysmex XN-1000 Core Counter',
        department: 'HEMATOLOGY',
        testsRemaining: 640,
        dailyConsumptionRate: 135,
        daysOfStockRemaining: 4.8,
        safetyStockThreshold: 300,
        reorderLeadTimeDays: 3,
        stockoutRisk: 'OPTIMAL',
        recommendedReorderDate: '2026-10-22',
        expiryDate: '2027-04-30',
        daysToExpiry: 196,
        expiryExposureRisk: false,
        provenance: 'LIVE',
    },
    {
        reagentId: 'RGT-IMM-TRP-03',
        reagentName: 'Abbott ARCHITECT STAT High Sensitivity Troponin-I',
        analyzerId: 'ANZ-IMM-01',
        analyzerName: 'Abbott ARCHITECT i2000SR',
        department: 'IMMUNOASSAY',
        testsRemaining: 190,
        dailyConsumptionRate: 100,
        daysOfStockRemaining: 1.9,
        safetyStockThreshold: 200,
        reorderLeadTimeDays: 2,
        stockoutRisk: 'ELEVATED_WATCH',
        recommendedReorderDate: '2026-10-17',
        expiryDate: '2026-12-15',
        daysToExpiry: 60,
        expiryExposureRisk: false,
        provenance: 'LIVE',
    },
];

const INITIAL_DELTA_ALERTS: DeltaCheckAlert[] = [
    {
        id: 'DELTA-2026-001',
        sampleBarcode: 'LC-BC-901844',
        patientUhid: 'UHID-DL-2026-4002',
        patientNameMasked: 'P**** K**** (Age: 58, Male)',
        analyteCode: 'CREAT',
        analyteName: 'Serum Creatinine (Enzymatic)',
        currentValue: 2.85,
        previousValue: 1.20,
        unit: 'mg/dL',
        deltaAbs: 1.65,
        deltaPct: 137.5,
        elapsedHours: 18.0,
        velocityPerHour: 0.092,
        thresholdDeltaPct: 50.0,
        isCriticalAlert: true,
        clinicalInterpretation: 'Acute 137.5% rise in Serum Creatinine over 18h indicates KDIGO Stage 2 Acute Kidney Injury. Rule out post-renal obstruction or acute tubular necrosis.',
        timestamp: '2026-10-16T16:50:00Z',
    },
    {
        id: 'DELTA-2026-002',
        sampleBarcode: 'LC-BC-901843',
        patientUhid: 'UHID-DL-2026-4001',
        patientNameMasked: 'A**** S**** (Age: 34, Female)',
        analyteCode: 'HB',
        analyteName: 'Hemoglobin (Photometric Cyanide-Free)',
        currentValue: 7.4,
        previousValue: 11.8,
        unit: 'g/dL',
        deltaAbs: -4.4,
        deltaPct: -37.3,
        elapsedHours: 8.5,
        velocityPerHour: -0.518,
        thresholdDeltaPct: 20.0,
        isCriticalAlert: true,
        clinicalInterpretation: 'Severe 4.4 g/dL drop in Hemoglobin (-37.3%) over 8.5h indicates acute active internal hemorrhage. Blood Bank MTP cross-alert recommended.',
        timestamp: '2026-10-16T17:05:00Z',
    },
];

export const ENTERPRISE_FACILITIES: Record<HospitalFacilityId, FacilityProfile> = {
    'FACILITY-METRO-CORE': {
        id: 'FACILITY-METRO-CORE',
        name: 'Metropolitan Core University Medical Center',
        shortName: 'Metro Core (Quaternary Hub)',
        tier: 'TIER_1_QUATERNARY_TRAUMA',
        bedCount: 1250,
        dailyThroughput: 24800,
        accreditations: ['CAP LAP #89104', 'ISO 15189:2022', 'AABB Transfusion Service', 'Joint Commission Tier-1'],
        primaryLims: 'Epic Beaker Clinical LIS v2026.4',
        tlaTrackVelocityMps: 2.2,
        activeCleanroomClass: 'ISO Class 7 (Class 10,000)',
        directorOnDuty: 'Dr. Nikil Sharma, MD, FACP, FRCPath',
        location: 'Building A, Level B1 Central Pathology Quadrangle',
    },
    'FACILITY-NORTH-STAT': {
        id: 'FACILITY-NORTH-STAT',
        name: 'North Bay Emergency STAT & Trauma Pavilion',
        shortName: 'North Bay STAT Lab',
        tier: 'STAT_EMERGENCY_PAVILION',
        bedCount: 450,
        dailyThroughput: 9600,
        accreditations: ['CAP #77412', 'Joint Commission Comprehensive Stroke Center', 'ISO 15189'],
        primaryLims: 'Cerner Millennium PathNet',
        tlaTrackVelocityMps: 2.8,
        activeCleanroomClass: 'ISO Class 6 (Class 1,000 Rapid)',
        directorOnDuty: 'Dr. Sarah Lin, MD, FCAP',
        location: 'Emergency Trauma Hub, Ground Level',
    },
    'FACILITY-WEST-CANCER': {
        id: 'FACILITY-WEST-CANCER',
        name: 'Westside Comprehensive Cancer & Stem Cell Institute',
        shortName: 'West Cancer Wing',
        tier: 'COMPREHENSIVE_CANCER_CENTER',
        bedCount: 380,
        dailyThroughput: 7200,
        accreditations: ['CAP Molecular Pathology', 'CLIA High-Complexity NGS Certified', 'ISO 15189'],
        primaryLims: 'Sunquest LIS & Illumina Connected Analytics',
        tlaTrackVelocityMps: 1.8,
        activeCleanroomClass: 'ISO Class 6 Ultra-Clean',
        directorOnDuty: 'Dr. Marcus Vance, PhD, FACMG',
        location: 'Genomics & Proteomics Research Tower',
    },
    'FACILITY-SUBURBAN-CLINIC': {
        id: 'FACILITY-SUBURBAN-CLINIC',
        name: 'Suburban Robotic Satellite Diagnostic Outpost',
        shortName: 'Suburban Satellite Clinic',
        tier: 'LIGHTS_OUT_ROBOTIC_CLINIC',
        bedCount: 80,
        dailyThroughput: 3400,
        accreditations: ['CAP Accredited Point-of-Care Network', 'ISO 15189'],
        primaryLims: 'Meditech Expanse Cloud LIS',
        tlaTrackVelocityMps: 1.5,
        activeCleanroomClass: 'ISO Class 8 Standard Laboratory',
        directorOnDuty: 'Dr. Elena Rostova, MD',
        location: 'Outpatient Robotic Diagnostic Terminal',
    },
};

const INITIAL_WORK_ORDERS: BiomedicalWorkOrder[] = [
    {
        workOrderId: 'BMO-2026-9041',
        analyzerId: 'ANZ-BIO-01',
        analyzerName: 'Roche Cobas Pro c503 #1',
        taskTitle: 'Ion-Selective Electrode (ISE) 2-Point Recalibration & Slope Check',
        priority: 'EMERGENCY_STAT',
        status: 'IN_PROGRESS',
        assignedEngineer: 'Biomedical Eng. Alex Rivera (BME-Tier 3)',
        issuedTimestamp: '2026-10-16T17:10:00Z',
    },
    {
        workOrderId: 'BMO-2026-9038',
        analyzerId: 'ANZ-IMM-01',
        analyzerName: 'Abbott ARCHITECT i2000SR',
        taskTitle: 'Vortex Incubation Bath Temperature Sensor Baseline Verification',
        priority: 'ROUTINE',
        status: 'COMPLETED_VERIFIED',
        assignedEngineer: 'Lead Field Specialist Chen Wei',
        issuedTimestamp: '2026-10-15T09:30:00Z',
        completedTimestamp: '2026-10-15T11:15:00Z',
        resolutionNotes: 'Thermistor offset recalibrated within ±0.05°C tolerance (CLSI C24-A4 compliant).',
        replacedPartNumber: 'AB-THERM-441-A',
    },
];

export type NexusStoreContextValue = NexusState &

    NexusStoreActions & {
        state: NexusState;
        actions: NexusStoreActions;
    };

const NexusStoreContext = createContext<NexusStoreContextValue | null>(null);

export const NexusStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Navigation & Global Controls
    const [activeDomain, setActiveDomain] = useState<DomainPillarId>(1);
    const [activeTab, setActiveTabState] = useState<NexusTab>('OVERVIEW');
    const [activeRole, setActiveRole] = useState<'LAB_DIRECTOR' | 'PATHOLOGIST' | 'LAB_TECHNICIAN'>('LAB_DIRECTOR');
    const [activeFacility, setActiveFacility] = useState<HospitalFacilityId>('FACILITY-METRO-CORE');
    const [emergencyCode, setEmergencyCodeState] = useState<EmergencyStatCode>('NORMAL');
    const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
    const [searchBarcode, setSearchBarcode] = useState<string>('');
    const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

    // Reactive Operational Datasets
    const [facilities] = useState<Record<HospitalFacilityId, FacilityProfile>>(ENTERPRISE_FACILITIES);
    const [workOrders, setWorkOrders] = useState<BiomedicalWorkOrder[]>(INITIAL_WORK_ORDERS);
    const [uvcCycle, setUvcCycle] = useState<UvCDecontaminationRecord>({
        cycleId: 'UVC-2026-08',
        facilityId: activeFacility,
        durationSec: 180,
        remainingSec: 0,
        intensityMicrowattsPerCm2: 420,
        logReductionTarget: 6,
        active: false,
        timestamp: '2026-10-16T04:00:00Z',
        operatorRole: 'LAB_DIRECTOR',
    });
    const [isHl7LiveStreaming, setIsHl7LiveStreaming] = useState<boolean>(true);
    const [fleet, setFleet] = useState<EnterpriseAnalyzerTelemetry[]>(INITIAL_FLEET);

    const [departmentQueues, setDepartmentQueues] = useState<QueueProcessAnalytics[]>(INITIAL_QUEUES);
    const [proposals, setProposals] = useState<ControlledAutonomyProposal[]>(INITIAL_PROPOSALS);
    const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([
        {
            id: 'AUD-001',
            proposalId: 'PROP-2026-INIT',
            proposalTitle: 'Split-Rack Pre-Analytical Routing Protocol Initialized',
            decision: 'APPROVED_EXECUTED',
            role: 'LAB_DIRECTOR',
            reviewerName: 'Dr. Nikil (Chief Director)',
            timestamp: '2026-10-16T08:00:00Z',
            digitalSignature: 'SHA256:7b5d84a1e9c02d1844b2f150',
            notes: 'Standard morning shift baseline authorization verified.',
        },
    ]);
    const [deltaCheckAlerts, setDeltaCheckAlerts] = useState<DeltaCheckAlert[]>(INITIAL_DELTA_ALERTS);
    const [clinicalCommLogs, setClinicalCommLogs] = useState<ClinicalCommLogEntry[]>([]);
    const [reagentAlerts, setReagentAlerts] = useState<ReagentInventoryAdvisory[]>(INITIAL_REAGENTS);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
    const [liveSpecimens, setLiveSpecimens] = useState<LiveSpecimenCarrier[]>(INITIAL_SPECIMENS);
    const [paretoPolicy, setParetoPolicyState] = useState<'BALANCED_CLINICAL' | 'AGGRESSIVE_STAT' | 'REAGENT_CONSERVATIVE'>('BALANCED_CLINICAL');

    // HIL Simulator State
    const [hilSimulator, setHilSimulator] = useState<NexusState['hilSimulator']>({
        analyteCode: 'K_SERUM',
        hemolysisMgDl: 180,
        icterusMgDl: 8,
        lipemiaTurbidity: 45,
        calculatedBiasPct: 15.2,
        clsiAction: 'AUTOVERIFICATION_BLOCKED_REJECT',
        clinicalAdvisoryText: 'CRITICAL HEMOLYSIS: Free Hemoglobin (180 mg/dL) exceeds cutoff (50 mg/dL). Intracellular leakage artifactually elevates potassium. Mandatory redraw recommended.',
    });

    // Custom Setter for active tab ensuring domain sync
    const setActiveTab = useCallback((tab: NexusTab) => {
        setActiveTabState(tab);
        const parentPillar = DOMAIN_PILLARS.find((p) => p.tabs.some((t) => t.id === tab));
        if (parentPillar && parentPillar.id !== activeDomain) {
            setActiveDomain(parentPillar.id);
        }
    }, [activeDomain]);

    // Handle Emergency Code Activation
    const setEmergencyCode = useCallback((code: EmergencyStatCode) => {
        setEmergencyCodeState(code);
        if (code !== 'NORMAL') {
            // Prioritize Pareto policy to aggressive STAT
            setParetoPolicyState('AGGRESSIVE_STAT');
            // Elevate specimen priorities
            setLiveSpecimens((prev) =>
                prev.map((s) => {
                    if (code === 'CODE_STROKE' && s.department === 'COAGULATION') {
                        return { ...s, priority: 'STAT_EMERGENCY', estimatedCompletionMinutes: 6.0 };
                    }
                    if (code === 'CODE_SEPSIS' && (s.tests.includes('Blood Lactate STAT') || s.department === 'MICROBIOLOGY')) {
                        return { ...s, priority: 'STAT_EMERGENCY', estimatedCompletionMinutes: 5.0 };
                    }
                    if (code === 'CODE_TRAUMA_MTP' && s.department === 'HEMATOLOGY') {
                        return { ...s, priority: 'STAT_EMERGENCY', estimatedCompletionMinutes: 4.5 };
                    }
                    return s;
                })
            );
        } else {
            setParetoPolicyState('BALANCED_CLINICAL');
        }
    }, []);

    // Toggle Sound
    const toggleSoundMuted = useCallback(() => {
        setIsSoundMuted((prev) => !prev);
    }, []);

    // Scenario A: Authorize Failover Proposal
    const authorizeProposal = useCallback((proposalId: string, notes = 'Signed off under ISO 15189 protocol.') => {
        // Enforce RBAC
        if (activeRole !== 'PATHOLOGIST' && activeRole !== 'LAB_DIRECTOR') {
            return {
                success: false,
                message: 'PERMISSION DENIED: Controlled Autonomy Level 3 requires Pathologist or Lab Director authorization.',
            };
        }

        const prop = proposals.find((p) => p.id === proposalId);
        if (!prop) {
            return { success: false, message: 'Proposal not found' };
        }

        // 1. Move to audit trail
        const auditEntry: AuditTrailEntry = {
            id: `AUD-${Date.now()}`,
            proposalId: prop.id,
            proposalTitle: prop.title,
            decision: 'APPROVED_EXECUTED',
            role: activeRole,
            reviewerName: activeRole === 'LAB_DIRECTOR' ? 'Dr. Nikil (Chief Director)' : 'Dr. S. Mehta (Pathologist on Duty)',
            timestamp: new Date().toISOString(),
            digitalSignature: `SHA256:${Math.random().toString(36).substring(2, 14)}`,
            notes,
        };

        setAuditTrail((prev) => [auditEntry, ...prev]);
        setProposals((prev) => prev.filter((p) => p.id !== proposalId));

        // 2. Dynamic Fleet update: Cobas #2 absorbs the load
        setFleet((prev) =>
            prev.map((anz) => {
                if (anz.analyzerId === 'ANZ-BIO-02') {
                    return {
                        ...anz,
                        currentThroughputRealtime: 158,
                        currentQueueDepth: 34,
                        carouselRacksInProcess: 5,
                    };
                }
                return anz;
            })
        );

        // 3. Dynamic Queue relief: Biochemistry traffic drops from 93.3% to 74.0%
        setDepartmentQueues((prev) =>
            prev.map((q) => {
                if (q.department === 'BIOCHEMISTRY') {
                    return {
                        ...q,
                        trafficIntensityRho: 0.740,
                        meanWaitTimeWqMinutes: 4.2,
                        meanTotalTatWMinutes: 38.0,
                        predictedSlaBreachRatePct: 1.2,
                        bottleneckSeverity: 'OPTIMAL',
                    };
                }
                return q;
            })
        );

        return {
            success: true,
            message: `Proposal authorized by ${activeRole}. Worklist rerouted to secondary analyzer. Biochemistry queue relieved (ρ = 74.0%).`,
        };
    }, [activeRole, proposals]);

    // Reject Proposal
    const rejectProposal = useCallback((proposalId: string, notes = 'Proposal rejected by user.') => {
        const prop = proposals.find((p) => p.id === proposalId);
        if (!prop) return { success: false, message: 'Proposal not found' };

        const auditEntry: AuditTrailEntry = {
            id: `AUD-${Date.now()}`,
            proposalId: prop.id,
            proposalTitle: prop.title,
            decision: 'REJECTED',
            role: activeRole,
            reviewerName: activeRole === 'LAB_DIRECTOR' ? 'Dr. Nikil (Chief Director)' : 'Dr. Pathologist',
            timestamp: new Date().toISOString(),
            digitalSignature: `SHA256:${Math.random().toString(36).substring(2, 14)}`,
            notes,
        };

        setAuditTrail((prev) => [auditEntry, ...prev]);
        setProposals((prev) => prev.filter((p) => p.id !== proposalId));

        return {
            success: true,
            message: 'Proposal successfully rejected and logged to audit trail.',
        };
    }, [activeRole, proposals]);

    // Recalibrate Analyzer (Transitions LOCKED -> CALIBRATING -> ONLINE)
    const scheduleRecalibration = useCallback((analyzerId: string) => {
        setFleet((prev) =>
            prev.map((anz) => {
                if (anz.analyzerId === analyzerId) {
                    return {
                        ...anz,
                        status: 'ONLINE',
                        lastQcStatus: 'PASSED_CALIBRATION_REVERIFIED',
                        opticalLampHours: anz.opticalLampHours + 1,
                        currentThroughputRealtime: 140,
                        currentQueueDepth: 12,
                    };
                }
                return anz;
            })
        );
    }, []);

    // Acknowledge Delta-Check Alert
    const acknowledgeDeltaCheck = useCallback((alertId: string, clinicalNote: string) => {
        const alert = deltaCheckAlerts.find((a) => a.id === alertId);
        if (!alert) return;

        const logEntry: ClinicalCommLogEntry = {
            alertId: alert.id,
            analyteName: alert.analyteName,
            note: clinicalNote || 'Clinical team paged and informed of critical velocity.',
            timestamp: new Date().toISOString(),
            clinicianRole: activeRole,
            status: 'ACKNOWLEDGED_BY_CLINICIAN',
        };

        setClinicalCommLogs((prev) => [logEntry, ...prev]);
        setDeltaCheckAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }, [deltaCheckAlerts, activeRole]);

    // Generate Purchase Order
    const generatePurchaseOrder = useCallback((reagentId: string): PurchaseOrderRecord => {
        const item = reagentAlerts.find((r) => r.reagentId === reagentId);
        const poNumber = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const newPo: PurchaseOrderRecord = {
            poNumber,
            reagentId,
            reagentName: item?.reagentName || 'Analytical Reagent Pack',
            analyzerName: item?.analyzerName || 'Core Analyzer',
            quantityPacks: 6,
            unitPriceUsd: 480,
            totalAmountUsd: 2880,
            status: 'PO_GENERATED_DISPATCHED',
            timestamp: new Date().toISOString(),
            expectedDeliveryDays: 2,
        };

        setPurchaseOrders((prev) => [newPo, ...prev]);

        // Update Reagent Stockout status to dispatched
        setReagentAlerts((prev) =>
            prev.map((r) => {
                if (r.reagentId === reagentId) {
                    return {
                        ...r,
                        stockoutRisk: 'OPTIMAL',
                        testsRemaining: r.testsRemaining + 1200,
                        daysOfStockRemaining: r.daysOfStockRemaining + 6.5,
                    };
                }
                return r;
            })
        );

        return newPo;
    }, [reagentAlerts]);

    // Update HIL Simulator parameters
    const updateHilSimulator = useCallback((params: { analyteCode?: string; hemolysis?: number; icterus?: number; lipemia?: number }) => {
        setHilSimulator((prev) => {
            const analyte = params.analyteCode !== undefined ? params.analyteCode : prev.analyteCode;
            const h = params.hemolysis !== undefined ? params.hemolysis : prev.hemolysisMgDl;
            const i = params.icterus !== undefined ? params.icterus : prev.icterusMgDl;
            const l = params.lipemia !== undefined ? params.lipemia : prev.lipemiaTurbidity;

            // Simple clinical bias approximation
            let bias = 0;
            let action: 'CLEAR_AUTOVERIFIED' | 'FLAG_INTERPRETIVE_NOTE' | 'AUTOVERIFICATION_BLOCKED_REJECT' = 'CLEAR_AUTOVERIFIED';
            let note = 'Specimen optical indices clear. Auto-verification enabled.';

            if (analyte === 'K_SERUM') {
                bias = Number(((h / 50) * 4.2).toFixed(1));
                if (h >= 100) {
                    action = 'AUTOVERIFICATION_BLOCKED_REJECT';
                    note = `Critical Hemolysis (H=${h} mg/dL): Intracellular potassium release creates +${bias}% positive bias. Sample rejected for cold redraw.`;
                } else if (h >= 50) {
                    action = 'FLAG_INTERPRETIVE_NOTE';
                    note = `Mild Hemolysis (H=${h} mg/dL): Estimated +${bias}% potassium bias. Pathologist review advisory attached.`;
                }
            } else {
                bias = Number(((h / 200) * 2.5).toFixed(1));
                if (h > 200 || l > 350) {
                    action = 'FLAG_INTERPRETIVE_NOTE';
                    note = 'Turbidity/Hemolysis exceeds warning threshold. Dilution or ultracentrifugation required.';
                }
            }

            return {
                analyteCode: analyte,
                hemolysisMgDl: h,
                icterusMgDl: i,
                lipemiaTurbidity: l,
                calculatedBiasPct: bias,
                clsiAction: action,
                clinicalAdvisoryText: note,
            };
        });
    }, []);

    // Specimen Rerun Trigger
    const triggerSpecimenRerun = useCallback((sampleBarcode: string, actionType: 'REDRAW' | 'DILUTE_ULTRACENTRIFUGE') => {
        setLiveSpecimens((prev) =>
            prev.map((s) => {
                if (s.barcode === sampleBarcode) {
                    return {
                        ...s,
                        currentZoneName: actionType === 'REDRAW' ? 'Phlebotomy Redraw Infeed' : 'High-Speed Ultracentrifuge',
                        status: 'IN_CENTRIFUGE',
                        elapsedMinutes: 1.0,
                        stabilityRemainingPct: 100.0,
                    };
                }
                return s;
            })
        );
    }, []);

    // Pareto Policy Setter
    const setParetoPolicy = useCallback((policy: 'BALANCED_CLINICAL' | 'AGGRESSIVE_STAT' | 'REAGENT_CONSERVATIVE') => {
        setParetoPolicyState(policy);
    }, []);

    // Trigger Automated Whole-Lab UV-C Decontamination Cycle
    const triggerUvcDecontamination = useCallback(() => {
        setUvcCycle((prev) => ({
            ...prev,
            cycleId: `UVC-${Date.now().toString(36).toUpperCase()}`,
            active: true,
            remainingSec: prev.durationSec,
            timestamp: new Date().toISOString(),
        }));

        setTimeout(() => {
            setUvcCycle((prev) => ({ ...prev, active: false, remainingSec: 0 }));
        }, 6000);
    }, []);

    // Inject STAT Specimen (Emergency Direct Infeed onto TLA Track)
    const injectStatSpecimen = useCallback((specimenData?: Partial<LiveSpecimenCarrier>) => {
        const idNum = Math.floor(1000 + Math.random() * 9000);
        const newCarrier: LiveSpecimenCarrier = {
            carrierId: `CARRIER-STAT-${idNum}`,
            barcode: specimenData?.barcode || `LC-STAT-${idNum}`,
            patientUhid: specimenData?.patientUhid || `UHID-TRAUMA-${idNum}`,
            tubeColor: specimenData?.tubeColor || 'GREEN_HEPARIN',
            tubeLabel: specimenData?.tubeLabel || 'Lithium Heparin 3mL (STAT Urgent Troponin / Lactate)',
            tests: specimenData?.tests || ['STAT hs-Troponin I', 'Blood Lactate', 'Blood Gas'],
            department: specimenData?.department || 'BIOCHEMISTRY',
            priority: 'STAT_EMERGENCY',
            currentZoneId: 'ZONE-STAT-EXPRESS',
            currentZoneName: 'Express MagneMotion STAT Infeed',
            elapsedMinutes: 0.5,
            maxStabilityMinutes: 60,
            stabilityRemainingPct: 100.0,
            estimatedCompletionMinutes: 7.5,
            carrierPosition: { x: -80, y: 0, progressPct: 0.02 },
            status: 'ON_TRACK',
            ...specimenData,
        };

        setLiveSpecimens((prev) => [newCarrier, ...prev]);
        return newCarrier;
    }, []);

    // Launch High-Speed Aerial Pneumatic Tube Capsule
    const launchPneumaticCapsule = useCallback((origin: string, dest: string, priority: 'STAT_EMERGENCY' | 'URGENT' | 'ROUTINE' = 'STAT_EMERGENCY') => {
        const idNum = Math.floor(100 + Math.random() * 900);
        const newCarrier: LiveSpecimenCarrier = {
            carrierId: `CAPSULE-${idNum}`,
            barcode: `PT-CAP-${idNum}`,
            patientUhid: `UHID-OR-${idNum}`,
            tubeColor: 'LIGHT_BLUE_CITRATE',
            tubeLabel: 'Sodium Citrate 3.2% (STAT OR Rapid Coag)',
            tests: ['Emergency PT/INR', 'Fibrinogen Rapid'],
            department: 'COAGULATION',
            priority,
            currentZoneId: 'ZONE-PNEUMATIC',
            currentZoneName: `Pneumatic Transit (${origin} → ${dest})`,
            elapsedMinutes: 0.2,
            maxStabilityMinutes: 120,
            stabilityRemainingPct: 100.0,
            estimatedCompletionMinutes: 3.5,
            carrierPosition: { x: 0, y: 140, progressPct: 0.05 },
            status: 'ON_TRACK',
        };
        setLiveSpecimens((prev) => [newCarrier, ...prev]);
    }, []);

    // Dispatch Biomedical Work Order Ticket
    const dispatchWorkOrder = useCallback((analyzerId: string, taskTitle: string, priority: 'EMERGENCY_STAT' | 'HIGH' | 'ROUTINE' = 'HIGH') => {
        const targetAnz = fleet.find((a) => a.analyzerId === analyzerId);
        const newOrder: BiomedicalWorkOrder = {
            workOrderId: `BMO-${Date.now().toString(36).toUpperCase()}`,
            analyzerId,
            analyzerName: targetAnz?.name || analyzerId,
            taskTitle,
            priority,
            status: 'DISPATCHED_TO_ENGINEER',
            assignedEngineer: 'Biomedical Field Lead Eng. Alex Rivera',
            issuedTimestamp: new Date().toISOString(),
        };

        setWorkOrders((prev) => [newOrder, ...prev]);
        return newOrder;
    }, [fleet]);

    // Toggle HL7 Live Event Bus Stream
    const toggleHl7Stream = useCallback(() => {
        setIsHl7LiveStreaming((prev) => !prev);
    }, []);

    // Computed KPIs
    const kpis = useMemo(() => {
        const totalAnalyzersCount = fleet.length;
        const activeAnalyzersCount = fleet.filter((a) => a.status === 'ONLINE').length;
        const westgardViolationsCount = fleet.filter((a) => a.status === 'LOCKED_WESTGARD_VIOLATION').length;
        const fleetAvailabilityPct = Number(((activeAnalyzersCount / Math.max(1, totalAnalyzersCount)) * 100).toFixed(0));

        // Overall TAT & SLA rollups
        const tatP50 = paretoPolicy === 'AGGRESSIVE_STAT' ? 18.2 : paretoPolicy === 'REAGENT_CONSERVATIVE' ? 48.0 : 38.5;
        const isRerouted = proposals.length === 0;
        const predictedSlaBreachPct = isRerouted ? 1.2 : 4.8;

        return {
            dailyAccessions: 142 + (liveSpecimens.length > 5 ? liveSpecimens.length - 5 : 0),
            medianTatMinutes: tatP50,
            predictedSlaBreachPct,
            fleetAvailabilityPct,
            activeAnalyzersCount,
            totalAnalyzersCount,
            westgardViolationsCount,
        };
    }, [fleet, liveSpecimens.length, paretoPolicy, proposals]);

    const state: NexusState = {
        activeDomain,
        activeTab,
        activeRole,
        activeFacility,
        emergencyCode,
        isSoundMuted,
        searchBarcode,
        isAuditModalOpen,
        facilities,
        workOrders,
        uvcCycle,
        isHl7LiveStreaming,
        fleet,
        departmentQueues,
        proposals,
        auditTrail,
        deltaCheckAlerts,
        clinicalCommLogs,
        reagentAlerts,
        purchaseOrders,
        liveSpecimens,
        paretoPolicy,
        hilSimulator,
        kpis,
    };

    const actions: NexusStoreActions = {
        setActiveDomain,
        setActiveTab,
        setActiveRole,
        setActiveFacility,
        setEmergencyCode,
        toggleSoundMuted,
        setSearchBarcode,
        setIsAuditModalOpen,
        authorizeProposal,
        rejectProposal,
        scheduleRecalibration,
        acknowledgeDeltaCheck,
        generatePurchaseOrder,
        setParetoPolicy,
        updateHilSimulator,
        triggerSpecimenRerun,
        triggerUvcDecontamination,
        injectStatSpecimen,
        launchPneumaticCapsule,
        dispatchWorkOrder,
        toggleHl7Stream,
    };

    const value: NexusStoreContextValue = {
        ...state,
        ...actions,
        state,
        actions,
    };


    return <NexusStoreContext.Provider value={value}>{children}</NexusStoreContext.Provider>;
};

export const useNexusStore = () => {
    const context = useContext(NexusStoreContext);
    if (!context) {
        throw new Error('useNexusStore must be used within a NexusStoreProvider');
    }
    return context;
};

export default useNexusStore;
