/**
 * NIKIL-LABCORE-ELIS-OS // OMNISCIENT NEXUS
 * Module: virtualAnalyzerProtocols.ts
 * Enterprise Analyzer Profiles, ASTM E1381/E1394 State Machine & HL7 v2.5.1 MLLP Framing
 */

import {
  AnalyzerDepartment,
  AnalyzerId,
  CTRL_BYTES,
  ClsiEp07ParameterProfile,
  HilIndices,
  calculateAstmChecksum,
  calculateClsiEp07HilBias,
} from './virtualAnalyzerMath';

export interface AnalyzerParameterDefinition extends ClsiEp07ParameterProfile {
  name: string;
  loinc: string;
  units: string;
  decimals: number;
  refMin: number;
  refMax: number;
  panicLow: number;
  panicHigh: number;
  nominalMean: number;
  nominalSd: number;
  wavelengthNm: number;
  reagentPosition: number;
}

export interface EnterpriseAnalyzerProfile {
  id: AnalyzerId;
  name: string;
  manufacturer: string;
  modelCode: string;
  serialNumber: string;
  department: AnalyzerDepartment;
  protocolStandard: 'ASTM E1381/E1394' | 'HL7 v2.5.1 MLLP';
  ipEndpoint: string;
  tcpPort: number;
  baudRate: number;
  maxThroughputTph: number;
  accentColorHex: string;
  parameters: AnalyzerParameterDefinition[];
}

export interface SimulatedLisOrder {
  barcode: string;
  mrn: string;
  patientName: string;
  ageYears: number;
  sex: 'M' | 'F';
  ward: string;
  priority: 'ROUTINE' | 'STAT';
  orderedTestCodes: string[];
  specimenType: 'SERUM_SST' | 'K2_EDTA_WHOLE_BLOOD' | 'LI_HEPARIN_PLASMA';
}

export interface EvaluatedResultItem {
  code: string;
  name: string;
  loinc: string;
  value: number;
  trueUnbiasedValue: number;
  units: string;
  referenceRange: string;
  flag: 'N' | 'L' | 'H' | 'LL' | 'HH' | 'HIL_REJECT';
  wavelengthNm: number;
  hilBiasPct: number;
  gatedRejected: boolean;
  clsiComment: string;
}

// Alias for backwards/interchangeable typing compatibility
export type interfaceEvaluatedResultItem = EvaluatedResultItem;

export type AstmFsmPhase =
  | 'IDLE'
  | 'PHASE_1_ENQ_HANDSHAKE'
  | 'PHASE_2_HOST_QUERY_Q'
  | 'PHASE_3_LIS_MRN_MATCH'
  | 'PHASE_4_ORDER_DOWNLOAD_P_O'
  | 'PHASE_5_ROBOTIC_ASPIRATION'
  | 'PHASE_6_RESULT_EMISSION_R'
  | 'PHASE_7_CHECKSUM_VERIFICATION'
  | 'PHASE_8_TERMINATION_EOT';

export interface WireHexToken {
  offsetHex: string;
  byteHex: string;
  asciiDisplay: string;
  isControlChar: boolean;
  tokenBadge?: string;
}

export interface TelemetryFramePacket {
  id: string;
  timestampIso: string;
  direction: 'ANALYZER_TO_LIS' | 'LIS_TO_ANALYZER' | 'INTERNAL_BUS';
  fsmPhase: AstmFsmPhase;
  protocol: 'ASTM_E1394' | 'HL7_MLLP';
  recordType: 'ENQ' | 'ACK' | 'H' | 'Q' | 'P' | 'O' | 'R' | 'C' | 'L' | 'EOT' | 'MLLP_OUL';
  decodedText: string;
  frameSequenceNumber?: number;
  checksumHex?: string;
  checksumVerified?: boolean;
  rawBytes: number[];
  hexInspectorRows: WireHexToken[];
  isPanicAlert?: boolean;
  isHilReject?: boolean;
}

export const ENTERPRISE_ANALYZER_PROFILES: Record<AnalyzerId, EnterpriseAnalyzerProfile> = {
  ROCHE_COBAS_C503: {
    id: 'ROCHE_COBAS_C503',
    name: 'Roche Cobas Pro c503',
    manufacturer: 'Roche Diagnostics GmbH',
    modelCode: 'COBAS-PRO-C503',
    serialNumber: 'RC503-9948-DX',
    department: 'CLINICAL_CHEMISTRY',
    protocolStandard: 'ASTM E1381/E1394',
    ipEndpoint: '10.24.110.53',
    tcpPort: 5001,
    baudRate: 115200,
    maxThroughputTph: 1000,
    accentColorHex: '#06b6d4',
    parameters: [
      {
        code: 'GLU',
        name: 'Glucose (Hexokinase)',
        loinc: '2345-7',
        units: 'mg/dL',
        decimals: 0,
        refMin: 70,
        refMax: 99,
        panicLow: 45,
        panicHigh: 450,
        nominalMean: 94,
        nominalSd: 2.2,
        wavelengthNm: 340,
        reagentPosition: 1,
        hemolysisLimitMgDl: 500,
        icterusLimitMgDl: 40,
        lipemiaLimitIndex: 600,
        kHemolysisPctPerMgDl: -0.01,
        kIcterusPctPerMgDl: -0.15,
        kLipemiaPctPerIndex: 0.01,
      },
      {
        code: 'CREA',
        name: 'Serum Creatinine (Enzymatic)',
        loinc: '2160-0',
        units: 'mg/dL',
        decimals: 2,
        refMin: 0.65,
        refMax: 1.25,
        panicLow: 0.2,
        panicHigh: 6.5,
        nominalMean: 1.02,
        nominalSd: 0.04,
        wavelengthNm: 546,
        reagentPosition: 2,
        hemolysisLimitMgDl: 300,
        icterusLimitMgDl: 15,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.02,
        kIcterusPctPerMgDl: -1.45,
        kLipemiaPctPerIndex: 0.02,
      },
      {
        code: 'TBIL',
        name: 'Bilirubin Total (Diazo)',
        loinc: '1975-2',
        units: 'mg/dL',
        decimals: 2,
        refMin: 0.2,
        refMax: 1.2,
        panicLow: 0.0,
        panicHigh: 15.0,
        nominalMean: 0.78,
        nominalSd: 0.05,
        wavelengthNm: 570,
        reagentPosition: 3,
        hemolysisLimitMgDl: 150,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 300,
        kHemolysisPctPerMgDl: -0.08,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.05,
      },
      {
        code: 'DBIL',
        name: 'Bilirubin Direct',
        loinc: '1968-7',
        units: 'mg/dL',
        decimals: 2,
        refMin: 0.0,
        refMax: 0.3,
        panicLow: 0.0,
        panicHigh: 10.0,
        nominalMean: 0.18,
        nominalSd: 0.02,
        wavelengthNm: 546,
        reagentPosition: 4,
        hemolysisLimitMgDl: 100,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 250,
        kHemolysisPctPerMgDl: -0.14,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.04,
      },
      {
        code: 'ALT',
        name: 'SGPT / ALT (IFCC)',
        loinc: '1742-6',
        units: 'U/L',
        decimals: 0,
        refMin: 10,
        refMax: 49,
        panicLow: 0,
        panicHigh: 1000,
        nominalMean: 28,
        nominalSd: 1.5,
        wavelengthNm: 340,
        reagentPosition: 5,
        hemolysisLimitMgDl: 200,
        icterusLimitMgDl: 40,
        lipemiaLimitIndex: 150,
        kHemolysisPctPerMgDl: 0.12,
        kIcterusPctPerMgDl: -0.1,
        kLipemiaPctPerIndex: 0.08,
      },
      {
        code: 'AST',
        name: 'SGOT / AST (IFCC)',
        loinc: '1920-8',
        units: 'U/L',
        decimals: 0,
        refMin: 12,
        refMax: 38,
        panicLow: 0,
        panicHigh: 1000,
        nominalMean: 24,
        nominalSd: 1.4,
        wavelengthNm: 340,
        reagentPosition: 6,
        hemolysisLimitMgDl: 80, // Highly sensitive to RBC lysis
        icterusLimitMgDl: 40,
        lipemiaLimitIndex: 150,
        kHemolysisPctPerMgDl: 0.42,
        kIcterusPctPerMgDl: -0.08,
        kLipemiaPctPerIndex: 0.07,
      },
      {
        code: 'NA',
        name: 'Sodium (Indirect ISE)',
        loinc: '2951-2',
        units: 'mmol/L',
        decimals: 1,
        refMin: 136.0,
        refMax: 145.0,
        panicLow: 120.0,
        panicHigh: 160.0,
        nominalMean: 140.2,
        nominalSd: 0.8,
        wavelengthNm: 600,
        reagentPosition: 7,
        hemolysisLimitMgDl: 500,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 200, // Pseudohyponatremia in severe lipemia
        kHemolysisPctPerMgDl: -0.005,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: -0.035,
      },
      {
        code: 'K',
        name: 'Potassium (Indirect ISE)',
        loinc: '2823-3',
        units: 'mmol/L',
        decimals: 2,
        refMin: 3.5,
        refMax: 5.1,
        panicLow: 2.8,
        panicHigh: 6.2,
        nominalMean: 4.25,
        nominalSd: 0.08,
        wavelengthNm: 600,
        reagentPosition: 8,
        hemolysisLimitMgDl: 60, // Strict CLSI EP07 Hemolysis gate due to intracellular K+ release
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 300,
        kHemolysisPctPerMgDl: 0.16,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: -0.01,
      },
      {
        code: 'CL',
        name: 'Chloride (Indirect ISE)',
        loinc: '2075-0',
        units: 'mmol/L',
        decimals: 1,
        refMin: 98.0,
        refMax: 107.0,
        panicLow: 80.0,
        panicHigh: 120.0,
        nominalMean: 102.4,
        nominalSd: 0.9,
        wavelengthNm: 600,
        reagentPosition: 9,
        hemolysisLimitMgDl: 500,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 300,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: -0.015,
      },
    ],
  },
  SYSMEX_XN_1000: {
    id: 'SYSMEX_XN_1000',
    name: 'Sysmex XN-1000 (5-Part Hematology)',
    manufacturer: 'Sysmex Corporation',
    modelCode: 'XN-1000-R',
    serialNumber: 'SXN1K-7712-JP',
    department: 'HEMATOLOGY_5PART',
    protocolStandard: 'ASTM E1381/E1394',
    ipEndpoint: '10.24.110.68',
    tcpPort: 5100,
    baudRate: 115200,
    maxThroughputTph: 100,
    accentColorHex: '#10b981',
    parameters: [
      {
        code: 'HGB',
        name: 'Hemoglobin (SLS-HGB)',
        loinc: '718-7',
        units: 'g/dL',
        decimals: 1,
        refMin: 12.5,
        refMax: 17.0,
        panicLow: 7.0,
        panicHigh: 20.0,
        nominalMean: 14.6,
        nominalSd: 0.25,
        wavelengthNm: 555,
        reagentPosition: 1,
        hemolysisLimitMgDl: 1000,
        icterusLimitMgDl: 35,
        lipemiaLimitIndex: 180,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.12,
        kLipemiaPctPerIndex: 0.04,
      },
      {
        code: 'WBC',
        name: 'White Blood Cell Count (WNR/WDF)',
        loinc: '6690-2',
        units: '10^3/uL',
        decimals: 2,
        refMin: 4.0,
        refMax: 10.5,
        panicLow: 1.5,
        panicHigh: 35.0,
        nominalMean: 7.15,
        nominalSd: 0.18,
        wavelengthNm: 633,
        reagentPosition: 2,
        hemolysisLimitMgDl: 1000,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 400,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.01,
      },
      {
        code: 'RBC',
        name: 'Red Blood Cell Count (DC Sheath)',
        loinc: '789-8',
        units: '10^6/uL',
        decimals: 2,
        refMin: 4.2,
        refMax: 5.8,
        panicLow: 2.0,
        panicHigh: 7.5,
        nominalMean: 4.88,
        nominalSd: 0.09,
        wavelengthNm: 633,
        reagentPosition: 3,
        hemolysisLimitMgDl: 250,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 400,
        kHemolysisPctPerMgDl: -0.05,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'HCT',
        name: 'Hematocrit (RBC Pulse Height)',
        loinc: '4544-3',
        units: '%',
        decimals: 1,
        refMin: 37.0,
        refMax: 50.0,
        panicLow: 20.0,
        panicHigh: 60.0,
        nominalMean: 43.2,
        nominalSd: 0.6,
        wavelengthNm: 633,
        reagentPosition: 4,
        hemolysisLimitMgDl: 250,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 400,
        kHemolysisPctPerMgDl: -0.05,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'PLT',
        name: 'Platelet Count (PLT-I / PLT-F)',
        loinc: '777-3',
        units: '10^3/uL',
        decimals: 0,
        refMin: 150,
        refMax: 410,
        panicLow: 30,
        panicHigh: 1000,
        nominalMean: 265,
        nominalSd: 8.5,
        wavelengthNm: 633,
        reagentPosition: 5,
        hemolysisLimitMgDl: 150, // RBC micro-fragments falsely elevate impedance PLT
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 400,
        kHemolysisPctPerMgDl: 0.09,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.01,
      },
      {
        code: 'NEUT%',
        name: 'Neutrophils % (WDF)',
        loinc: '770-8',
        units: '%',
        decimals: 1,
        refMin: 40.0,
        refMax: 72.0,
        panicLow: 10.0,
        panicHigh: 95.0,
        nominalMean: 58.4,
        nominalSd: 1.2,
        wavelengthNm: 633,
        reagentPosition: 6,
        hemolysisLimitMgDl: 1000,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'LYMPH%',
        name: 'Lymphocytes % (WDF)',
        loinc: '736-9',
        units: '%',
        decimals: 1,
        refMin: 20.0,
        refMax: 45.0,
        panicLow: 5.0,
        panicHigh: 85.0,
        nominalMean: 31.2,
        nominalSd: 0.9,
        wavelengthNm: 633,
        reagentPosition: 7,
        hemolysisLimitMgDl: 1000,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'MONO%',
        name: 'Monocytes % (WDF)',
        loinc: '5905-5',
        units: '%',
        decimals: 1,
        refMin: 2.0,
        refMax: 10.0,
        panicLow: 0.0,
        panicHigh: 35.0,
        nominalMean: 6.8,
        nominalSd: 0.4,
        wavelengthNm: 633,
        reagentPosition: 8,
        hemolysisLimitMgDl: 1000,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'EO%',
        name: 'Eosinophils % (WDF)',
        loinc: '713-8',
        units: '%',
        decimals: 1,
        refMin: 1.0,
        refMax: 6.0,
        panicLow: 0.0,
        panicHigh: 30.0,
        nominalMean: 2.9,
        nominalSd: 0.3,
        wavelengthNm: 633,
        reagentPosition: 9,
        hemolysisLimitMgDl: 1000,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'BASO%',
        name: 'Basophils % (WNR)',
        loinc: '706-2',
        units: '%',
        decimals: 1,
        refMin: 0.0,
        refMax: 1.5,
        panicLow: 0.0,
        panicHigh: 5.0,
        nominalMean: 0.7,
        nominalSd: 0.1,
        wavelengthNm: 633,
        reagentPosition: 10,
        hemolysisLimitMgDl: 1000,
        icterusLimitMgDl: 60,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
    ],
  },
  ABBOTT_ARCHITECT_I2000SR: {
    id: 'ABBOTT_ARCHITECT_I2000SR',
    name: 'Abbott Architect i2000SR (CMIA)',
    manufacturer: 'Abbott Laboratories',
    modelCode: 'ARCH-I2000SR',
    serialNumber: 'AA2K-4409-US',
    department: 'IMMUNOASSAY_CMIA',
    protocolStandard: 'ASTM E1381/E1394',
    ipEndpoint: '10.24.110.82',
    tcpPort: 5200,
    baudRate: 115200,
    maxThroughputTph: 200,
    accentColorHex: '#a855f7',
    parameters: [
      {
        code: 'TROP-I',
        name: 'High-Sensitivity Troponin-I (STAT)',
        loinc: '89579-7',
        units: 'ng/mL',
        decimals: 3,
        refMin: 0.0,
        refMax: 0.026,
        panicLow: -1.0,
        panicHigh: 0.04, // STAT Panic threshold > 0.040 ng/mL
        nominalMean: 0.012,
        nominalSd: 0.002,
        wavelengthNm: 430, // Acridinium ester chemiluminescence emission
        reagentPosition: 1,
        hemolysisLimitMgDl: 350,
        icterusLimitMgDl: 40,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: -0.02,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'TSH',
        name: 'Thyroid Stimulating Hormone (3rd Gen)',
        loinc: '3016-3',
        units: 'uIU/mL',
        decimals: 2,
        refMin: 0.35,
        refMax: 4.94,
        panicLow: 0.01,
        panicHigh: 45.0,
        nominalMean: 2.15,
        nominalSd: 0.08,
        wavelengthNm: 430,
        reagentPosition: 2,
        hemolysisLimitMgDl: 500,
        icterusLimitMgDl: 50,
        lipemiaLimitIndex: 600,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'FT4',
        name: 'Free Thyroxine (FT4)',
        loinc: '3024-7',
        units: 'ng/dL',
        decimals: 2,
        refMin: 0.7,
        refMax: 1.48,
        panicLow: 0.25,
        panicHigh: 4.5,
        nominalMean: 1.12,
        nominalSd: 0.04,
        wavelengthNm: 430,
        reagentPosition: 3,
        hemolysisLimitMgDl: 500,
        icterusLimitMgDl: 50,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.01,
      },
      {
        code: 'FERR',
        name: 'Serum Ferritin',
        loinc: '2276-4',
        units: 'ng/mL',
        decimals: 1,
        refMin: 22.0,
        refMax: 322.0,
        panicLow: 4.0,
        panicHigh: 2500.0,
        nominalMean: 118.5,
        nominalSd: 4.2,
        wavelengthNm: 430,
        reagentPosition: 4,
        hemolysisLimitMgDl: 350,
        icterusLimitMgDl: 50,
        lipemiaLimitIndex: 500,
        kHemolysisPctPerMgDl: 0.03,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
      {
        code: 'BHCG',
        name: 'Total Beta-hCG',
        loinc: '21198-7',
        units: 'mIU/mL',
        decimals: 1,
        refMin: 0.0,
        refMax: 5.0,
        panicLow: -1.0,
        panicHigh: 150000.0,
        nominalMean: 1.8,
        nominalSd: 0.2,
        wavelengthNm: 430,
        reagentPosition: 5,
        hemolysisLimitMgDl: 500,
        icterusLimitMgDl: 50,
        lipemiaLimitIndex: 600,
        kHemolysisPctPerMgDl: 0.0,
        kIcterusPctPerMgDl: 0.0,
        kLipemiaPctPerIndex: 0.0,
      },
    ],
  },
};

export const SIMULATED_LIS_PATIENT_ORDERS: Record<AnalyzerId, SimulatedLisOrder[]> = {
  ROCHE_COBAS_C503: [
    {
      barcode: 'LAB-TUBE-8841',
      mrn: 'MRN-2026-09412',
      patientName: 'SHARMA^RAJESHWAR^K',
      ageYears: 58,
      sex: 'M',
      ward: 'ICU-CARDIOTHORACIC-02',
      priority: 'ROUTINE',
      orderedTestCodes: ['GLU', 'CREA', 'TBIL', 'DBIL', 'ALT', 'AST', 'NA', 'K', 'CL'],
      specimenType: 'SERUM_SST',
    },
    {
      barcode: 'LAB-TUBE-8842',
      mrn: 'MRN-2026-09418',
      patientName: 'MENON^ANANYA^S',
      ageYears: 41,
      sex: 'F',
      ward: 'NEPHROLOGY-HD-04',
      priority: 'STAT',
      orderedTestCodes: ['GLU', 'CREA', 'NA', 'K', 'CL'],
      specimenType: 'LI_HEPARIN_PLASMA',
    },
  ],
  SYSMEX_XN_1000: [
    {
      barcode: 'LAB-TUBE-9104',
      mrn: 'MRN-2026-10284',
      patientName: 'CHATTERJEE^DEBASHIS^M',
      ageYears: 64,
      sex: 'M',
      ward: 'HEME-ONCOLOGY-B1',
      priority: 'ROUTINE',
      orderedTestCodes: ['HGB', 'WBC', 'RBC', 'HCT', 'PLT', 'NEUT%', 'LYMPH%', 'MONO%', 'EO%', 'BASO%'],
      specimenType: 'K2_EDTA_WHOLE_BLOOD',
    },
  ],
  ABBOTT_ARCHITECT_I2000SR: [
    {
      barcode: 'LAB-TUBE-7729',
      mrn: 'MRN-2026-11902',
      patientName: 'DESHMUKH^VIKRAM^R',
      ageYears: 62,
      sex: 'M',
      ward: 'ED-RESUS-BAY-01',
      priority: 'STAT',
      orderedTestCodes: ['TROP-I', 'TSH', 'FT4', 'FERR', 'BHCG'],
      specimenType: 'SERUM_SST',
    },
  ],
};

/**
 * Converts a byte array into structured hex/ASCII wire tokens for the Pane B Hex Inspector
 */
export function buildHexInspectorTokens(rawBytes: number[]): WireHexToken[] {
  const controlMap: Record<number, string> = {
    [CTRL_BYTES.STX]: '<STX>',
    [CTRL_BYTES.ETX]: '<ETX>',
    [CTRL_BYTES.EOT]: '<EOT>',
    [CTRL_BYTES.ENQ]: '<ENQ>',
    [CTRL_BYTES.ACK]: '<ACK>',
    [CTRL_BYTES.LF]: '<LF>',
    [CTRL_BYTES.VT]: '<VT>',
    [CTRL_BYTES.CR]: '<CR>',
    [CTRL_BYTES.NAK]: '<NAK>',
    [CTRL_BYTES.ETB]: '<ETB>',
    [CTRL_BYTES.FS]: '<FS>',
  };

  return rawBytes.map((b, idx) => {
    const tokenBadge = controlMap[b];
    const isControlChar = tokenBadge !== undefined || b < 0x20 || b > 0x7e;
    return {
      offsetHex: idx.toString(16).toUpperCase().padStart(4, '0'),
      byteHex: b.toString(16).toUpperCase().padStart(2, '0'),
      asciiDisplay: tokenBadge ?? String.fromCharCode(b),
      isControlChar,
      tokenBadge,
    };
  });
}

/**
 * Builds an ASTM E1381 Low-Level Framed Packet:
 * <STX>[FrameNumber 1..7][RecordPayload]<CR><ETX>[CS1][CS2]<CR><LF>
 */
export function createFramedAstmPacket(
  frameSequenceNumber: number,
  recordType: TelemetryFramePacket['recordType'],
  recordPayload: string,
  direction: TelemetryFramePacket['direction'],
  fsmPhase: AstmFsmPhase,
  options?: { isPanicAlert?: boolean; isHilReject?: boolean }
): TelemetryFramePacket {
  const seqMod = ((frameSequenceNumber - 1) % 7) + 1;
  const frameBody = `${seqMod}${recordPayload}`;
  const checksumHex = calculateAstmChecksum(frameBody, true);

  const rawBytes: number[] = [CTRL_BYTES.STX];
  for (let i = 0; i < frameBody.length; i += 1) {
    rawBytes.push(frameBody.charCodeAt(i));
  }
  rawBytes.push(CTRL_BYTES.CR, CTRL_BYTES.ETX);
  rawBytes.push(checksumHex.charCodeAt(0), checksumHex.charCodeAt(1));
  rawBytes.push(CTRL_BYTES.CR, CTRL_BYTES.LF);

  return {
    id: `ASTM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestampIso: new Date().toISOString(),
    direction,
    fsmPhase,
    protocol: 'ASTM_E1394',
    recordType,
    decodedText: recordPayload,
    frameSequenceNumber: seqMod,
    checksumHex,
    checksumVerified: true,
    rawBytes,
    hexInspectorRows: buildHexInspectorTokens(rawBytes),
    isPanicAlert: options?.isPanicAlert,
    isHilReject: options?.isHilReject,
  };
}

/**
 * Builds a single-byte ASTM Control Signal Packet (<ENQ>, <ACK>, <EOT>)
 */
export function createControlSignalPacket(
  signal: 'ENQ' | 'ACK' | 'EOT',
  direction: TelemetryFramePacket['direction'],
  fsmPhase: AstmFsmPhase
): TelemetryFramePacket {
  const byteVal =
    signal === 'ENQ' ? CTRL_BYTES.ENQ : signal === 'ACK' ? CTRL_BYTES.ACK : CTRL_BYTES.EOT;
  const rawBytes = [byteVal];

  return {
    id: `CTRL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestampIso: new Date().toISOString(),
    direction,
    fsmPhase,
    protocol: 'ASTM_E1394',
    recordType: signal,
    decodedText: `[${signal}] (0x${byteVal.toString(16).toUpperCase().padStart(2, '0')})`,
    rawBytes,
    hexInspectorRows: buildHexInspectorTokens(rawBytes),
  };
}

/**
 * Builds an HL7 v2.5.1 OUL^R22 Unsolicited Laboratory Observation MLLP Frame
 * Framed with <VT> (0x0B) ... <FS><CR> (0x1C 0x0D)
 */
export function createHl7MllpResultPacket(
  analyzer: EnterpriseAnalyzerProfile,
  order: SimulatedLisOrder,
  results: EvaluatedResultItem[]
): TelemetryFramePacket {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const segments: string[] = [
    `MSH|^~\\&|${analyzer.modelCode}|${analyzer.serialNumber}|NIKIL-LABCORE-ELIS|OMNISCIENT-NEXUS|${ts}||OUL^R22^OUL_R22|MSG-${ts}|P|2.5.1|||AL|NE`,
    `PID|1||${order.mrn}^^^LABCORE^MR||${order.patientName}||19680412|${order.sex}`,
    `SPM|1|${order.barcode}||${order.specimenType}|||||||P`,
    `OBR|1|${order.barcode}|${order.barcode}|PANEL^${analyzer.department}|||${ts}|||||||||||||||${ts}|||F`,
  ];

  let hasPanic = false;
  let hasHil = false;

  results.forEach((res, idx) => {
    if (res.flag === 'HH' || res.flag === 'LL') hasPanic = true;
    if (res.gatedRejected) hasHil = true;
    segments.push(
      `OBX|${idx + 1}|NM|${res.loinc}^${res.name}^LN||${
        res.gatedRejected ? 'HIL_GATED' : res.value
      }|${res.units}|${res.referenceRange}|${res.flag}|||F|||${ts}||${analyzer.serialNumber}`
    );
  });

  const payload = segments.join('\r');
  const rawBytes: number[] = [CTRL_BYTES.VT];
  for (let i = 0; i < payload.length; i += 1) {
    rawBytes.push(payload.charCodeAt(i));
  }
  rawBytes.push(CTRL_BYTES.FS, CTRL_BYTES.CR);

  return {
    id: `MLLP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestampIso: new Date().toISOString(),
    direction: 'ANALYZER_TO_LIS',
    fsmPhase: 'PHASE_6_RESULT_EMISSION_R',
    protocol: 'HL7_MLLP',
    recordType: 'MLLP_OUL',
    decodedText: segments.join('\n'),
    rawBytes,
    hexInspectorRows: buildHexInspectorTokens(rawBytes),
    isPanicAlert: hasPanic,
    isHilReject: hasHil,
  };
}

/**
 * Evaluates a full parameter set for an analyzer run with optional clinical chaos overrides
 */
export function evaluateAnalyzerSampleRun(
  analyzer: EnterpriseAnalyzerProfile,
  hil: HilIndices,
  chaosMode: 'NONE' | 'HEMOLYZED_SERUM' | 'CARDIAC_STAT_PANIC' | 'COLD_CHAIN_DEGRADED',
  seedCounter: number
): EvaluatedResultItem[] {
  return analyzer.parameters.map((param, idx) => {
    const deterministicWave = Math.sin(seedCounter * 1.7 + idx * 0.9);
    let rawTrueValue = param.nominalMean + deterministicWave * (param.nominalSd * 0.85);

    // Apply Cardiac STAT Emergency override
    if (chaosMode === 'CARDIAC_STAT_PANIC') {
      if (param.code === 'TROP-I') {
        rawTrueValue = 1.842; // Critical STEMI panic (> 0.040 ng/mL)
      } else if (param.code === 'K') {
        rawTrueValue = 6.48; // Hyperkalemia panic
      } else if (param.code === 'AST') {
        rawTrueValue = 195;
      } else if (param.code === 'WBC') {
        rawTrueValue = 18.6;
      }
    }

    // Apply Cold-Chain Breach thermal denaturation override
    if (chaosMode === 'COLD_CHAIN_DEGRADED') {
      rawTrueValue = rawTrueValue * 0.78;
    }

    const hilEval = calculateClsiEp07HilBias(rawTrueValue, hil, param, param.decimals);
    const finalVal = hilEval.observedValue;

    let flag: EvaluatedResultItem['flag'] = 'N';
    if (hilEval.gatedRejected) {
      flag = 'HIL_REJECT';
    } else if (param.panicHigh > 0 && finalVal >= param.panicHigh) {
      flag = 'HH';
    } else if (param.panicLow >= 0 && finalVal <= param.panicLow) {
      flag = 'LL';
    } else if (finalVal > param.refMax) {
      flag = 'H';
    } else if (finalVal < param.refMin) {
      flag = 'L';
    }

    return {
      code: param.code,
      name: param.name,
      loinc: param.loinc,
      value: finalVal,
      trueUnbiasedValue: Number(rawTrueValue.toFixed(param.decimals)),
      units: param.units,
      referenceRange: `${param.refMin}-${param.refMax}`,
      flag,
      wavelengthNm: param.wavelengthNm,
      hilBiasPct: hilEval.spectralBiasPct,
      gatedRejected: hilEval.gatedRejected,
      clsiComment: hilEval.clsiAnnotation,
    };
  });
}

/**
 * Generates the complete 8-Stage Bidirectional ASTM E1381/E1394 State Machine Sequence
 */
export function buildBidirectionalAstmExchange(
  analyzer: EnterpriseAnalyzerProfile,
  order: SimulatedLisOrder,
  evaluatedResults: EvaluatedResultItem[]
): TelemetryFramePacket[] {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const packets: TelemetryFramePacket[] = [];
  let seq = 1;

  // Step 1: [ENQ] -> [ACK] Handshake
  packets.push(
    createControlSignalPacket('ENQ', 'ANALYZER_TO_LIS', 'PHASE_1_ENQ_HANDSHAKE'),
    createControlSignalPacket('ACK', 'LIS_TO_ANALYZER', 'PHASE_1_ENQ_HANDSHAKE')
  );

  // Step 2: Analyzer emits Header + Host Query Q|1|^LAB-TUBE-XXXX||ALL
  packets.push(
    createFramedAstmPacket(
      seq++,
      'H',
      `H|\\^&|||${analyzer.modelCode}^${analyzer.serialNumber}|||||NIKIL-LABCORE-ELIS||P|1|${ts}`,
      'ANALYZER_TO_LIS',
      'PHASE_2_HOST_QUERY_Q'
    ),
    createFramedAstmPacket(
      seq++,
      'Q',
      `Q|1|^${order.barcode}||ALL||||||||O`,
      'ANALYZER_TO_LIS',
      'PHASE_2_HOST_QUERY_Q'
    ),
    createFramedAstmPacket(seq++, 'L', 'L|1|N', 'ANALYZER_TO_LIS', 'PHASE_2_HOST_QUERY_Q'),
    createControlSignalPacket('EOT', 'ANALYZER_TO_LIS', 'PHASE_2_HOST_QUERY_Q')
  );

  // Step 3 & 4: LIS matches Patient MRN & Test Profile and downloads P|1|... and O|1|...
  const testString = order.orderedTestCodes.map((c) => `^^^${c}`).join('\\');
  packets.push(
    createControlSignalPacket('ENQ', 'LIS_TO_ANALYZER', 'PHASE_3_LIS_MRN_MATCH'),
    createControlSignalPacket('ACK', 'ANALYZER_TO_LIS', 'PHASE_3_LIS_MRN_MATCH'),
    createFramedAstmPacket(
      seq++,
      'H',
      `H|\\^&|||NIKIL-LABCORE-ELIS^OMNISCIENT-NEXUS|||||${analyzer.modelCode}||P|1|${ts}`,
      'LIS_TO_ANALYZER',
      'PHASE_4_ORDER_DOWNLOAD_P_O'
    ),
    createFramedAstmPacket(
      seq++,
      'P',
      `P|1||${order.mrn}||${order.patientName}||19680412|${order.sex}|||||DR_MENON||${order.ward}`,
      'LIS_TO_ANALYZER',
      'PHASE_4_ORDER_DOWNLOAD_P_O'
    ),
    createFramedAstmPacket(
      seq++,
      'O',
      `O|1|${order.barcode}||${testString}|${order.priority === 'STAT' ? 'S' : 'R'}|${ts}|||||A||||${order.specimenType}`,
      'LIS_TO_ANALYZER',
      'PHASE_4_ORDER_DOWNLOAD_P_O'
    ),
    createFramedAstmPacket(seq++, 'L', 'L|1|N', 'LIS_TO_ANALYZER', 'PHASE_4_ORDER_DOWNLOAD_P_O'),
    createControlSignalPacket('EOT', 'LIS_TO_ANALYZER', 'PHASE_4_ORDER_DOWNLOAD_P_O')
  );

  // Step 5 & 6: Analyzer aspirates sample, measures optics, and emits Result records R|n|...
  packets.push(
    createControlSignalPacket('ENQ', 'ANALYZER_TO_LIS', 'PHASE_5_ROBOTIC_ASPIRATION'),
    createControlSignalPacket('ACK', 'LIS_TO_ANALYZER', 'PHASE_5_ROBOTIC_ASPIRATION'),
    createFramedAstmPacket(
      seq++,
      'H',
      `H|\\^&|||${analyzer.modelCode}^${analyzer.serialNumber}|||||NIKIL-LABCORE-ELIS||P|1|${ts}`,
      'ANALYZER_TO_LIS',
      'PHASE_6_RESULT_EMISSION_R'
    ),
    createFramedAstmPacket(
      seq++,
      'P',
      `P|1||${order.mrn}||${order.patientName}||19680412|${order.sex}`,
      'ANALYZER_TO_LIS',
      'PHASE_6_RESULT_EMISSION_R'
    ),
    createFramedAstmPacket(
      seq++,
      'O',
      `O|1|${order.barcode}||${testString}|${order.priority === 'STAT' ? 'S' : 'R'}|${ts}|||||N||||${order.specimenType}`,
      'ANALYZER_TO_LIS',
      'PHASE_6_RESULT_EMISSION_R'
    )
  );

  evaluatedResults.forEach((res, idx) => {
    const isPanic = res.flag === 'HH' || res.flag === 'LL';
    const isHil = res.gatedRejected;
    const resultValueToken = isHil ? 'HIL_GATED' : String(res.value);
    packets.push(
      createFramedAstmPacket(
        seq++,
        'R',
        `R|${idx + 1}|^^^${res.code}^${res.loinc}|${resultValueToken}|${res.units}|${res.referenceRange}|${res.flag}||F||||${ts}|${analyzer.serialNumber}`,
        'ANALYZER_TO_LIS',
        'PHASE_6_RESULT_EMISSION_R',
        { isPanicAlert: isPanic, isHilReject: isHil }
      )
    );

    if (isHil || isPanic) {
      packets.push(
        createFramedAstmPacket(
          seq++,
          'C',
          `C|1|I|${isHil ? res.clsiComment : `CRITICAL_PANIC_THRESHOLD_BREACH_${res.code}`}|G`,
          'ANALYZER_TO_LIS',
          'PHASE_7_CHECKSUM_VERIFICATION',
          { isPanicAlert: isPanic, isHilReject: isHil }
        )
      );
    }
  });

  // Step 7 & 8: Checksum Verification & Termination L|1|N + [EOT]
  packets.push(
    createFramedAstmPacket(seq++, 'L', 'L|1|N', 'ANALYZER_TO_LIS', 'PHASE_8_TERMINATION_EOT'),
    createControlSignalPacket('EOT', 'ANALYZER_TO_LIS', 'PHASE_8_TERMINATION_EOT'),
    createControlSignalPacket('ACK', 'LIS_TO_ANALYZER', 'PHASE_8_TERMINATION_EOT')
  );

  return packets;
}
