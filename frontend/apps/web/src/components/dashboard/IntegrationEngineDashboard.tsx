"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Send,
  Download,
  Upload,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  Server,
  Database,
  ArrowRight,
  ArrowLeftRight,
  Zap,
  Globe,
  Radio,
  Clock,
  Check,
  X,
  FileCode,
  FileText,
  Copy,
  Terminal,
  Share2,
  Stethoscope,
  Building2,
  PhoneCall,
  Flame,
  Award,
  Sparkles,
  QrCode,
  Sliders,
  ChevronDown,
  ChevronRight,
  Info,
  HelpCircle,
  Eye,
  Trash2,
  AlertOctagon,
  Thermometer,
  Wifi,
  WifiOff,
  Lock,
  FileCheck,
  FileSpreadsheet
} from "lucide-react";

// =========================================================================
// TYPES & INTERFACES
// =========================================================================

export type IntegrationProtocol =
  | "HL7 v2.5.1"
  | "FHIR R4"
  | "ASTM E1394 / E1381"
  | "ABDM M1-M3"
  | "DICOM / PACS"
  | "WhatsApp Cloud API"
  | "SMS DLT Gateway"
  | "IoT MQTT / LoRaWAN"
  | "REST Webhook";

export type ChannelStatus = "ONLINE" | "BUSY" | "STANDBY" | "ATTENTION" | "OFFLINE";

export interface IntegrationChannel {
  id: string;
  name: string;
  code: string;
  category: "HIS_EMR" | "ANALYZER" | "NATIONAL_ABDM" | "RADIOLOGY" | "MESSAGING" | "IOT_COLDCHAIN" | "BILLING_TPA";
  protocol: IntegrationProtocol;
  endpoint: string;
  port: string;
  status: ChannelStatus;
  throughputPerMin: number;
  avgLatencyMs: number;
  processedToday: number;
  errorCount: number;
  lastHeartbeat: string;
  description: string;
  instruments?: string[];
  autoRetry: boolean;
}

export interface StreamPacket {
  id: string;
  timestamp: string;
  channelId: string;
  channelName: string;
  protocol: IntegrationProtocol;
  direction: "INBOUND" | "OUTBOUND";
  messageType: string; // e.g. ORU_R01, ORM_O01, ADT_A01, ASTM_FRAME, FHIR_BUNDLE
  status: "PROCESSED" | "QUEUED" | "FAILED" | "RETRYING";
  patientUhid: string;
  patientName: string;
  sampleBarcode: string;
  testAssay: string;
  rawPayload: string;
  parsedSummary: string;
  latencyMs: number;
  errorMessage?: string;
}

export interface DeadLetterItem {
  id: string;
  timestamp: string;
  source: string;
  protocol: IntegrationProtocol;
  payloadType: string;
  uhid: string;
  patientName: string;
  sampleBarcode: string;
  errorReason: string;
  failedAttempts: number;
  rawMessage: string;
  suggestedFix: string;
}

export interface TestMappingItem {
  id: string;
  localCode: string;
  localName: string;
  department: string;
  analyzerCode: string;
  loincCode: string;
  snomedCode: string;
  hisBillingCode: string;
  unit: string;
  sampleType: string;
  status: "ACTIVE" | "PENDING_VERIFICATION";
}

export interface ColdChainSensor {
  id: string;
  location: string;
  unitName: string;
  temperatureC: number;
  targetRange: string;
  humidityPct: number;
  status: "OPTIMAL" | "WARNING" | "CRITICAL";
  batteryPct: number;
  powerSource: "MAINS_AC" | "BATTERY_BACKUP";
  lastPing: string;
}

// =========================================================================
// MOCK DATA GENERATORS (ENTERPRISE GRADE HOSPITAL DATA)
// =========================================================================

const initialChannels: IntegrationChannel[] = [
  {
    id: "ch-his-01",
    name: "Apex Central HIS & EMR Bridge",
    code: "HIS-HL7-INOUT",
    category: "HIS_EMR",
    protocol: "HL7 v2.5.1",
    endpoint: "mllp://his.apex-hospital.local:2575",
    port: "TCP MLLP :2575",
    status: "ONLINE",
    throughputPerMin: 58,
    avgLatencyMs: 14,
    processedToday: 1420,
    errorCount: 1,
    lastHeartbeat: "Just now",
    description: "Inpatient/Outpatient admissions (ADT-A01/A08) and doctor pathology orders (ORM-O01) bidirectional exchange.",
    autoRetry: true,
  },
  {
    id: "ch-analyzer-01",
    name: "Roche Cobas c311 / e411 Chemistry & CLIA",
    code: "ROCHE-COBAS-ASTM",
    category: "ANALYZER",
    protocol: "ASTM E1394 / E1381",
    endpoint: "tcp://192.168.1.120:5000",
    port: "TCP Socket :5000",
    status: "BUSY",
    throughputPerMin: 42,
    avgLatencyMs: 8,
    processedToday: 890,
    errorCount: 0,
    lastHeartbeat: "3s ago",
    description: "Automated bidirectional sample query, rack barcode scanner, and numerical assay ingest with real-time flag checks.",
    instruments: ["Cobas c311 Chemistry", "Cobas e411 Immuno"],
    autoRetry: true,
  },
  {
    id: "ch-analyzer-02",
    name: "Sysmex XN-1000 Automated Hematology",
    code: "SYSMEX-XN-COM",
    category: "ANALYZER",
    protocol: "ASTM E1394 / E1381",
    endpoint: "serial:///dev/ttyUSB0 (COM3)",
    port: "Serial RS-232 9600-8-N-1",
    status: "ONLINE",
    throughputPerMin: 36,
    avgLatencyMs: 12,
    processedToday: 640,
    errorCount: 0,
    lastHeartbeat: "5s ago",
    description: "CBC 5-Part Differential, flags for Blasts/Immature Granulocytes, and numerical count parsing directly from analyzer.",
    instruments: ["Sysmex XN-1000"],
    autoRetry: true,
  },
  {
    id: "ch-abdm-01",
    name: "ABDM / ABHA National Gateway (M1-M3)",
    code: "NDHM-ABDM-GW",
    category: "NATIONAL_ABDM",
    protocol: "ABDM M1-M3",
    endpoint: "https://gateway.abdm.gov.in/v0.5",
    port: "HTTPS TLS 1.3 :443",
    status: "ONLINE",
    throughputPerMin: 22,
    avgLatencyMs: 185,
    processedToday: 412,
    errorCount: 0,
    lastHeartbeat: "12s ago",
    description: "Scan & Share counter QR check-ins, Care Context linking (M2), and FHIR DiagnosticReport encrypted exchange (M3).",
    autoRetry: true,
  },
  {
    id: "ch-pacs-01",
    name: "Radiology PACS & DICOM Modality Worklist",
    code: "PACS-DICOM-MWL",
    category: "RADIOLOGY",
    protocol: "DICOM / PACS",
    endpoint: "dicom://pacs.apex-hospital.local:104",
    port: "DICOM C-STORE :104",
    status: "ONLINE",
    throughputPerMin: 15,
    avgLatencyMs: 45,
    processedToday: 184,
    errorCount: 0,
    lastHeartbeat: "22s ago",
    description: "X-Ray, Ultrasound, 2D Echo modality worklist sync and DICOM Web Viewer URI synchronization.",
    autoRetry: true,
  },
  {
    id: "ch-wa-01",
    name: "WhatsApp Business Cloud Dispatcher",
    code: "WHATSAPP-META-API",
    category: "MESSAGING",
    protocol: "WhatsApp Cloud API",
    endpoint: "https://graph.facebook.com/v19.0/messages",
    port: "REST Webhook :443",
    status: "ONLINE",
    throughputPerMin: 28,
    avgLatencyMs: 95,
    processedToday: 512,
    errorCount: 0,
    lastHeartbeat: "Just now",
    description: "Instant digitally signed NABL PDF test report delivery with QR verification link and Panic STAT doctor alerts.",
    autoRetry: true,
  },
  {
    id: "ch-sms-01",
    name: "National DLT SMS Gateway (Fast2SMS / Gupshup)",
    code: "SMS-DLT-TRANS",
    category: "MESSAGING",
    protocol: "SMS DLT Gateway",
    endpoint: "https://api.sms-provider.in/v2/send",
    port: "HTTPS REST :443",
    status: "ONLINE",
    throughputPerMin: 18,
    avgLatencyMs: 65,
    processedToday: 380,
    errorCount: 0,
    lastHeartbeat: "1m ago",
    description: "Transactional patient collection reminders, OTP verifications, and doctor dispatch alerts via registered DLT templates.",
    autoRetry: true,
  },
  {
    id: "ch-iot-01",
    name: "IoT Cold-Chain & Centrifuge Mesh",
    code: "IOT-SENSORS-MQTT",
    category: "IOT_COLDCHAIN",
    protocol: "IoT MQTT / LoRaWAN",
    endpoint: "mqtt://iot.apex-hospital.local:1883",
    port: "MQTT Broker :1883",
    status: "ONLINE",
    throughputPerMin: 48,
    avgLatencyMs: 6,
    processedToday: 3450,
    errorCount: 0,
    lastHeartbeat: "2s ago",
    description: "Continuous 24x7 temperature telemetry for Blood Bank (-30°C), Sample Storage (4°C), and Reagent Cold Rooms.",
    autoRetry: true,
  },
  {
    id: "ch-b2b-01",
    name: "Franchise & B2B Sub-Lab Specimen Exchange",
    code: "B2B-REST-SYNC",
    category: "HIS_EMR",
    protocol: "REST Webhook",
    endpoint: "https://b2b.apex-diagnostics.com/api/v1/sync",
    port: "REST API :443",
    status: "STANDBY",
    throughputPerMin: 8,
    avgLatencyMs: 110,
    processedToday: 95,
    errorCount: 0,
    lastHeartbeat: "2m ago",
    description: "North City Collection Center & Referral clinic batch specimen barcode synchronization and B2B pricing split.",
    autoRetry: true,
  },
  {
    id: "ch-stat-01",
    name: "Emergency Casualty STAT Panic Broadcaster",
    code: "STAT-PANIC-PAGER",
    category: "HIS_EMR",
    protocol: "REST Webhook",
    endpoint: "https://pager.apex-hospital.local/api/stat",
    port: "Internal LAN :8443",
    status: "ONLINE",
    throughputPerMin: 4,
    avgLatencyMs: 9,
    processedToday: 24,
    errorCount: 0,
    lastHeartbeat: "Just now",
    description: "Direct priority bus for critical laboratory panic values pushing audio alarms to ICU & Emergency Doctor consoles.",
    autoRetry: true,
  },
];

const initialPackets: StreamPacket[] = [
  {
    id: "pkt-901",
    timestamp: "12:28:45",
    channelId: "ch-analyzer-01",
    channelName: "Roche Cobas c311",
    protocol: "ASTM E1394 / E1381",
    direction: "INBOUND",
    messageType: "ASTM_RESULT (R)",
    status: "PROCESSED",
    patientUhid: "UHID-89241",
    patientName: "Sunita Verma",
    sampleBarcode: "SMP-782910",
    testAssay: "Serum Potassium (K+)",
    rawPayload: "H|\\^&|||Roche^Cobas-c311|||||||P|1\nP|1||UHID-89241||Verma^Sunita||F||||||||||\nO|1|SMP-782910||^^^K+|||||||A\nR|1|^^^K+|4.2|mmol/L|3.5-5.1|N||F||||20261009122840\nL|1|N",
    parsedSummary: "Potassium: 4.2 mmol/L (Normal 3.5-5.1). Ingested into LIS Workstation #2.",
    latencyMs: 9,
  },
  {
    id: "pkt-902",
    timestamp: "12:28:10",
    channelId: "ch-his-01",
    channelName: "Apex Central HIS",
    protocol: "HL7 v2.5.1",
    direction: "INBOUND",
    messageType: "ORM_O01 (Order)",
    status: "PROCESSED",
    patientUhid: "UHID-77219",
    patientName: "Rajesh Malhotra",
    sampleBarcode: "SMP-782911",
    testAssay: "Liver Function Test (LFT Panel)",
    rawPayload: "MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009122805||ORM^O01|MSG-9421|P|2.5.1\nPID|1||UHID-77219^^^MRN||Malhotra^Rajesh||19780512|M\nPV1|1|I|ICU^BED-04^BLOCK-A\nORC|NW|ORD-9821|||||^^^20261009122800\nOBR|1|ORD-9821||LFT^Liver Function Test Panel||||||||||||DOC-441^Dr. A. Mehra",
    parsedSummary: "New Order for ICU Bed #04: LFT Panel prescribed by Dr. A. Mehra. Requisition generated.",
    latencyMs: 14,
  },
  {
    id: "pkt-903",
    timestamp: "12:27:30",
    channelId: "ch-analyzer-02",
    channelName: "Sysmex XN-1000",
    protocol: "ASTM E1394 / E1381",
    direction: "INBOUND",
    messageType: "ASTM_RESULT (R)",
    status: "PROCESSED",
    patientUhid: "UHID-94102",
    patientName: "Kavita Rao",
    sampleBarcode: "SMP-782912",
    testAssay: "Complete Blood Count (CBC)",
    rawPayload: "H|\\^&|||Sysmex^XN-1000|||||||P|1\nP|1||UHID-94102||Rao^Kavita||F\nO|1|SMP-782912||^^^CBC\nR|1|^^^WBC|7.8|10^3/uL|4.0-11.0|N||F\nR|2|^^^RBC|4.65|10^6/uL|3.8-5.2|N||F\nR|3|^^^HGB|13.8|g/dL|12.0-15.5|N||F\nR|4|^^^PLT|245|10^3/uL|150-450|N||F\nL|1|N",
    parsedSummary: "CBC Ingested: Hb 13.8 g/dL, WBC 7.8, Platelets 245k. Passed delta-check criteria.",
    latencyMs: 11,
  },
  {
    id: "pkt-904",
    timestamp: "12:26:55",
    channelId: "ch-abdm-01",
    channelName: "ABDM Gateway",
    protocol: "ABDM M1-M3",
    direction: "OUTBOUND",
    messageType: "FHIR_BUNDLE (M3)",
    status: "PROCESSED",
    patientUhid: "UHID-63110",
    patientName: "Arun Kulkarni",
    sampleBarcode: "SMP-782905",
    testAssay: "Lipid Profile & HbA1c",
    rawPayload: "{\n  \"resourceType\": \"Bundle\",\n  \"type\": \"document\",\n  \"entry\": [\n    {\n      \"resource\": {\n        \"resourceType\": \"DiagnosticReport\",\n        \"status\": \"final\",\n        \"code\": { \"coding\": [{ \"system\": \"http://loinc.org\", \"code\": \"57698-3\" }] },\n        \"subject\": { \"reference\": \"Patient/ABHA-91-4491-8921\" }\n      }\n    }\n  ]\n}",
    parsedSummary: "DiagnosticReport FHIR R4 Bundle dispatched to ABHA Health Locker. Encrypted with ABDM Public Key.",
    latencyMs: 195,
  },
  {
    id: "pkt-905",
    timestamp: "12:25:40",
    channelId: "ch-wa-01",
    channelName: "WhatsApp Cloud",
    protocol: "WhatsApp Cloud API",
    direction: "OUTBOUND",
    messageType: "DOCUMENT_DISPATCH",
    status: "PROCESSED",
    patientUhid: "UHID-89241",
    patientName: "Sunita Verma",
    sampleBarcode: "SMP-782910",
    testAssay: "Serum Electrolytes Report PDF",
    rawPayload: "{\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"919876543210\",\n  \"type\": \"template\",\n  \"template\": {\n    \"name\": \"lab_report_dispatch_nabl\",\n    \"language\": { \"code\": \"en\" },\n    \"components\": [\n      { \"type\": \"header\", \"parameters\": [{ \"type\": \"document\", \"document\": { \"link\": \"https://lis.apex.in/r/SMP-782910.pdf\" } }] }\n    ]\n  }\n}",
    parsedSummary: "Digital signed PDF report delivered to +91 98765 43210. Delivery receipt acknowledged.",
    latencyMs: 88,
  },
  {
    id: "pkt-906",
    timestamp: "12:24:12",
    channelId: "ch-his-01",
    channelName: "Apex Central HIS",
    protocol: "HL7 v2.5.1",
    direction: "INBOUND",
    messageType: "ORM_O01 (Order)",
    status: "FAILED",
    patientUhid: "UHID-MISSING",
    patientName: "Unknown IPD Patient",
    sampleBarcode: "SMP-UNKNOWN",
    testAssay: "Serum Trop-I (STAT)",
    rawPayload: "MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009122400||ORM^O01|MSG-9419|P|2.5.1\nPID|1||||^^||||||\nOBR|1|||TROP_I^Troponin-I Rapid||||||||||||DOC-99",
    parsedSummary: "Rejected: Segment PID missing mandatory Patient Identifier / UHID field.",
    latencyMs: 4,
    errorMessage: "PID.3 (Patient ID) is empty. Required for specimen chain of custody.",
  },
];

const initialDeadLetterItems: DeadLetterItem[] = [
  {
    id: "dlq-01",
    timestamp: "12:24:12",
    source: "Apex Central HIS (HL7 Port :2575)",
    protocol: "HL7 v2.5.1",
    payloadType: "ORM^O01",
    uhid: "UHID-MISSING",
    patientName: "Unknown IPD Patient",
    sampleBarcode: "SMP-UNKNOWN",
    errorReason: "Mandatory Segment PID.3 (Patient Identifier) was missing from inbound HIS order packet.",
    failedAttempts: 3,
    rawMessage: "MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009122400||ORM^O01|MSG-9419|P|2.5.1\nPID|1||||^^||||||\nOBR|1|||TROP_I^Troponin-I Rapid||||||||||||DOC-99",
    suggestedFix: "Auto-query HIS Database by Bed # (ICU Bed 07) or request nurse station to re-issue requisition.",
  },
  {
    id: "dlq-02",
    timestamp: "11:58:34",
    source: "Roche Cobas c311 (TCP :5000)",
    protocol: "ASTM E1394 / E1381",
    payloadType: "ASTM_RESULT",
    uhid: "UHID-71092",
    patientName: "Ramesh Joshi",
    sampleBarcode: "SMP-782804",
    errorReason: "Unmapped Analyzer Test Code: Received code 'GLU_HEXO_FAST' which has no active crosswalk in LIS test directory.",
    failedAttempts: 2,
    rawMessage: "R|1|^^^GLU_HEXO_FAST|114|mg/dL|70-99|H||F||||20261009115822",
    suggestedFix: "Map 'GLU_HEXO_FAST' to LIS Master Test #104 ('Fasting Blood Glucose - Hexokinase Method').",
  },
];

const initialTestMappings: TestMappingItem[] = [
  {
    id: "tm-1",
    localCode: "CBC_HB",
    localName: "Hemoglobin (Blood)",
    department: "Hematology",
    analyzerCode: "HGB",
    loincCode: "718-7",
    snomedCode: "116859006",
    hisBillingCode: "BIL-HEM-001",
    unit: "g/dL",
    sampleType: "Whole Blood (EDTA)",
    status: "ACTIVE",
  },
  {
    id: "tm-2",
    localCode: "BIO_POTASS",
    localName: "Serum Potassium (K+)",
    department: "Biochemistry",
    analyzerCode: "K+",
    loincCode: "2823-3",
    snomedCode: "8881000119106",
    hisBillingCode: "BIL-BIO-012",
    unit: "mmol/L",
    sampleType: "Serum (SST Gel)",
    status: "ACTIVE",
  },
  {
    id: "tm-3",
    localCode: "BIO_CREAT",
    localName: "Serum Creatinine",
    department: "Biochemistry",
    analyzerCode: "CREAT_J",
    loincCode: "2160-0",
    snomedCode: "70901006",
    hisBillingCode: "BIL-BIO-004",
    unit: "mg/dL",
    sampleType: "Serum (SST Gel)",
    status: "ACTIVE",
  },
  {
    id: "tm-4",
    localCode: "CLIA_TSH",
    localName: "Thyroid Stimulating Hormone (Ultra-Sensitive)",
    department: "Immunology",
    analyzerCode: "TSH_3GEN",
    loincCode: "3016-3",
    snomedCode: "39641006",
    hisBillingCode: "BIL-IMM-002",
    unit: "uIU/mL",
    sampleType: "Serum (SST Gel)",
    status: "ACTIVE",
  },
  {
    id: "tm-5",
    localCode: "CLIA_TROP_I",
    localName: "High Sensitivity Troponin-I (STAT)",
    department: "Immunology",
    analyzerCode: "TROP_I_HS",
    loincCode: "89579-7",
    snomedCode: "105677002",
    hisBillingCode: "BIL-IMM-045",
    unit: "ng/L",
    sampleType: "Plasma (Lithium Heparin)",
    status: "ACTIVE",
  },
  {
    id: "tm-6",
    localCode: "HBA1C_HPLC",
    localName: "Glycated Hemoglobin (HbA1c - HPLC)",
    department: "Biochemistry",
    analyzerCode: "A1C_HPLC",
    loincCode: "4548-4",
    snomedCode: "43396009",
    hisBillingCode: "BIL-BIO-021",
    unit: "%",
    sampleType: "Whole Blood (EDTA)",
    status: "ACTIVE",
  },
  {
    id: "tm-7",
    localCode: "DENGUE_NS1",
    localName: "Dengue Virus NS1 Antigen (Rapid CLIA)",
    department: "Serology",
    analyzerCode: "DENG_NS1_AG",
    loincCode: "75382-2",
    snomedCode: "414081005",
    hisBillingCode: "BIL-SER-008",
    unit: "Index",
    sampleType: "Serum (SST Gel)",
    status: "ACTIVE",
  },
];

const initialColdSensors: ColdChainSensor[] = [
  {
    id: "sen-01",
    location: "Central Pathology Store",
    unitName: "Main Sample Refrigerator #01",
    temperatureC: 4.2,
    targetRange: "2.0°C - 8.0°C",
    humidityPct: 45,
    status: "OPTIMAL",
    batteryPct: 98,
    powerSource: "MAINS_AC",
    lastPing: "Just now",
  },
  {
    id: "sen-02",
    location: "Blood Bank Transfusion Unit",
    unitName: "Plasma Cryo-Freezer -30°C",
    temperatureC: -28.6,
    targetRange: "-35.0°C - -25.0°C",
    humidityPct: 22,
    status: "OPTIMAL",
    batteryPct: 95,
    powerSource: "MAINS_AC",
    lastPing: "2s ago",
  },
  {
    id: "sen-03",
    location: "Biochemistry Analyzer Bay",
    unitName: "Reagent Carousel Cold-Well",
    temperatureC: 6.8,
    targetRange: "4.0°C - 8.0°C",
    humidityPct: 42,
    status: "OPTIMAL",
    batteryPct: 100,
    powerSource: "MAINS_AC",
    lastPing: "5s ago",
  },
  {
    id: "sen-04",
    location: "Ambulance / STAT Transit Box",
    unitName: "B2B Courier Specimen Cooler #04",
    temperatureC: 5.1,
    targetRange: "2.0°C - 8.0°C",
    humidityPct: 58,
    status: "OPTIMAL",
    batteryPct: 78,
    powerSource: "BATTERY_BACKUP",
    lastPing: "18s ago",
  },
];

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function IntegrationEngineDashboard() {
  // Navigation sub-tab within Integration Engine
  const [activeEngineTab, setActiveEngineTab] = useState<
    "channels" | "stream" | "simulator" | "dlq" | "mapping" | "coldchain" | "audit"
  >("channels");

  // State
  const [channels, setChannels] = useState<IntegrationChannel[]>(initialChannels);
  const [packets, setPackets] = useState<StreamPacket[]>(initialPackets);
  const [deadLetters, setDeadLetters] = useState<DeadLetterItem[]>(initialDeadLetterItems);
  const [mappings, setMappings] = useState<TestMappingItem[]>(initialTestMappings);
  const [sensors, setSensors] = useState<ColdChainSensor[]>(initialColdSensors);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [livePulseActive, setLivePulseActive] = useState(true);

  // Inspector modal / drawer
  const [inspectPacket, setInspectPacket] = useState<StreamPacket | null>(null);
  const [inspectDeadLetter, setInspectDeadLetter] = useState<DeadLetterItem | null>(null);

  // Simulation form states
  const [simType, setSimType] = useState<"HIS_ADT" | "COBAS_RESULT" | "SYSMEX_CBC" | "ABDM_SCAN" | "STAT_PANIC">("COBAS_RESULT");
  const [simPatientName, setSimPatientName] = useState("Vikas K. Patil");
  const [simUhid, setSimUhid] = useState("UHID-88421");
  const [simBarcode, setSimBarcode] = useState("SMP-991044");
  const [simTestAssay, setSimTestAssay] = useState("Serum Potassium");
  const [simValue, setSimValue] = useState("6.8"); // High panic value for realistic test
  const [simIsPanic, setSimIsPanic] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
  const [simSuccessMessage, setSimSuccessMessage] = useState<string | null>(null);

  // Add Mapping Modal
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);
  const [newMapLocalCode, setNewMapLocalCode] = useState("");
  const [newMapLocalName, setNewMapLocalName] = useState("");
  const [newMapAnalyzerCode, setNewMapAnalyzerCode] = useState("");
  const [newMapLoinc, setNewMapLoinc] = useState("");
  const [newMapUnit, setNewMapUnit] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Channel toggling / restarting
  const handleToggleChannelStatus = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        const nextStatus: ChannelStatus = ch.status === "ONLINE" || ch.status === "BUSY" ? "STANDBY" : "ONLINE";
        showToast(`Channel "${ch.name}" status updated to ${nextStatus}`);
        return { ...ch, status: nextStatus };
      })
    );
  };

  const handleRestartChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        showToast(`Flushed message buffers & restarted channel: "${ch.name}"`);
        return { ...ch, status: "ONLINE", errorCount: 0, lastHeartbeat: "Just now" };
      })
    );
  };

  // Run Simulator
  const handleExecuteSimulation = () => {
    setSimRunning(true);
    setSimSuccessMessage(null);

    setTimeout(() => {
      let newPacket: StreamPacket;
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      if (simType === "HIS_ADT") {
        newPacket = {
          id: `pkt-${Date.now()}`,
          timestamp: timeStr,
          channelId: "ch-his-01",
          channelName: "Apex Central HIS",
          protocol: "HL7 v2.5.1",
          direction: "INBOUND",
          messageType: "ADT_A01 (Admit)",
          status: "PROCESSED",
          patientUhid: simUhid,
          patientName: simPatientName,
          sampleBarcode: "N/A (Patient Registration)",
          testAssay: "Inpatient Ward Admission (Bed: ICU-02)",
          rawPayload: `MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|${now.toISOString()}||ADT^A01|MSG-${Math.floor(Math.random() * 90000)}|P|2.5.1\nPID|1||${simUhid}^^^MRN||${simPatientName.replace(" ", "^")}||19850212|M\nPV1|1|I|ICU^BED-02^BLOCK-A||||DOC-441^Dr. A. Mehra`,
          parsedSummary: `Patient ${simPatientName} (${simUhid}) admitted to ICU Bed 02. Ward admission synchronized with LIS phlebotomy ledger.`,
          latencyMs: 12,
        };
      } else if (simType === "COBAS_RESULT") {
        newPacket = {
          id: `pkt-${Date.now()}`,
          timestamp: timeStr,
          channelId: "ch-analyzer-01",
          channelName: "Roche Cobas c311",
          protocol: "ASTM E1394 / E1381",
          direction: "INBOUND",
          messageType: "ASTM_RESULT (R)",
          status: "PROCESSED",
          patientUhid: simUhid,
          patientName: simPatientName,
          sampleBarcode: simBarcode,
          testAssay: `${simTestAssay} (${simValue} mmol/L)${simIsPanic ? " 🚨 CRITICAL" : ""}`,
          rawPayload: `H|\\^&|||Roche^Cobas-c311|||||||P|1\nP|1||${simUhid}||${simPatientName.replace(" ", "^")}||M\nO|1|${simBarcode}||^^^K+\nR|1|^^^K+|${simValue}|mmol/L|3.5-5.1|${simIsPanic ? "HH" : "N"}||F||||${now.toISOString()}\nL|1|N`,
          parsedSummary: `Result parsed: ${simTestAssay} = ${simValue} mmol/L. ${simIsPanic ? "PANIC ALERT TRIGGERED! Pushed to Critical Action Desk." : "Normal result. Queued for validation."}`,
          latencyMs: 7,
        };
      } else if (simType === "SYSMEX_CBC") {
        newPacket = {
          id: `pkt-${Date.now()}`,
          timestamp: timeStr,
          channelId: "ch-analyzer-02",
          channelName: "Sysmex XN-1000",
          protocol: "ASTM E1394 / E1381",
          direction: "INBOUND",
          messageType: "ASTM_RESULT (R)",
          status: "PROCESSED",
          patientUhid: simUhid,
          patientName: simPatientName,
          sampleBarcode: simBarcode,
          testAssay: "Complete Blood Count (CBC 5-Diff)",
          rawPayload: `H|\\^&|||Sysmex^XN-1000|||||||P|1\nP|1||${simUhid}||${simPatientName.replace(" ", "^")}\nO|1|${simBarcode}||^^^CBC\nR|1|^^^WBC|12.4|10^3/uL|4.0-11.0|H||F\nR|2|^^^HGB|14.2|g/dL|13.0-17.0|N||F\nR|3|^^^PLT|180|10^3/uL|150-450|N||F\nL|1|N`,
          parsedSummary: `Sysmex CBC Ingested: WBC 12.4 k/uL (High), Hb 14.2 g/dL, Platelets 180 k/uL. Re-run not required.`,
          latencyMs: 11,
        };
      } else if (simType === "ABDM_SCAN") {
        newPacket = {
          id: `pkt-${Date.now()}`,
          timestamp: timeStr,
          channelId: "ch-abdm-01",
          channelName: "ABDM Gateway",
          protocol: "ABDM M1-M3",
          direction: "INBOUND",
          messageType: "ABHA_SCAN_SHARE (M1)",
          status: "PROCESSED",
          patientUhid: simUhid,
          patientName: simPatientName,
          sampleBarcode: "TOKEN-OPD-048",
          testAssay: "ABHA Counter Token Generation",
          rawPayload: `{\n  \"abhaAddress\": \"${simPatientName.toLowerCase().replace(/[^a-z]/g, "")}@abdm\",\n  \"abhaNumber\": \"91-8842-1029-4412\",\n  \"name\": \"${simPatientName}\",\n  \"gender\": \"M\",\n  \"token\": \"048\",\n  \"counter\": \"PHLEB-COUNTER-01\"\n}`,
          parsedSummary: `ABHA Scan & Share Token #048 issued for ${simPatientName}. Patient demographics populated into OPD registration window.`,
          latencyMs: 140,
        };
      } else {
        newPacket = {
          id: `pkt-${Date.now()}`,
          timestamp: timeStr,
          channelId: "ch-stat-01",
          channelName: "Emergency STAT Broadcaster",
          protocol: "REST Webhook",
          direction: "OUTBOUND",
          messageType: "STAT_PANIC_ALERT",
          status: "PROCESSED",
          patientUhid: simUhid,
          patientName: simPatientName,
          sampleBarcode: simBarcode,
          testAssay: `🚨 EMERGENCY CASUALTY ALERT: ${simTestAssay} (${simValue})`,
          rawPayload: `{\n  \"priority\": \"STAT_EMERGENCY\",\n  \"uhid\": \"${simUhid}\",\n  \"patient\": \"${simPatientName}\",\n  \"criticalValue\": \"${simTestAssay}: ${simValue}\",\n  \"location\": \"ICU Block A\",\n  \"residentOnDuty\": \"Dr. Sandeep Deshmukh\",\n  \"sub15mCompliance\": true\n}`,
          parsedSummary: `Priority STAT Alarm broadcasted to ICU Ward Monitors & Doctor Mobile. Read-back countdown timer started (15m SLA).`,
          latencyMs: 5,
        };
      }

      setPackets((prev) => [newPacket, ...prev]);
      setSimRunning(false);
      setSimSuccessMessage(`Successfully processed & injected simulated packet into Integration Engine pipeline! Packet ID: ${newPacket.id}`);
      showToast("Simulation packet dispatched successfully!");
    }, 600);
  };

  // Re-drive dead letter
  const handleRedriveDeadLetter = (dlqId: string) => {
    const item = deadLetters.find((d) => d.id === dlqId);
    if (!item) return;

    showToast(`Re-driving packet "${item.payloadType}" (${item.uhid}) through Integration Engine...`);
    setDeadLetters((prev) => prev.filter((d) => d.id !== dlqId));

    const recoveryPacket: StreamPacket = {
      id: `pkt-recovery-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      channelId: "ch-his-01",
      channelName: "Auto-Heal Engine",
      protocol: item.protocol,
      direction: "INBOUND",
      messageType: item.payloadType,
      status: "PROCESSED",
      patientUhid: item.uhid === "UHID-MISSING" ? "UHID-77219 (Recovered)" : item.uhid,
      patientName: item.patientName === "Unknown IPD Patient" ? "Recovered Ward Patient" : item.patientName,
      sampleBarcode: item.sampleBarcode === "SMP-UNKNOWN" ? "SMP-782999" : item.sampleBarcode,
      testAssay: "Auto-Recovered Requisition",
      rawPayload: item.rawMessage,
      parsedSummary: `Recovered from Dead Letter Queue: Applied rule: "${item.suggestedFix}". Dispatched to live LIS pipeline.`,
      latencyMs: 16,
    };

    setPackets((prev) => [recoveryPacket, ...prev]);
  };

  // Add new mapping
  const handleAddNewMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapLocalCode || !newMapLocalName) return;

    const newMap: TestMappingItem = {
      id: `tm-${Date.now()}`,
      localCode: newMapLocalCode.toUpperCase(),
      localName: newMapLocalName,
      department: "Clinical Pathology",
      analyzerCode: newMapAnalyzerCode.toUpperCase() || newMapLocalCode.toUpperCase(),
      loincCode: newMapLoinc || "PENDING",
      snomedCode: "PENDING",
      hisBillingCode: `BIL-${newMapLocalCode.toUpperCase().slice(0, 3)}-101`,
      unit: newMapUnit || "N/A",
      sampleType: "Serum / Blood",
      status: "ACTIVE",
    };

    setMappings((prev) => [newMap, ...prev]);
    setIsAddMappingOpen(false);
    setNewMapLocalCode("");
    setNewMapLocalName("");
    setNewMapAnalyzerCode("");
    setNewMapLoinc("");
    setNewMapUnit("");
    showToast(`Test Code "${newMap.localCode}" mapped to Crosswalk Studio!`);
  };

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchSearch =
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProto = selectedProtocolFilter === "ALL" || ch.protocol === selectedProtocolFilter;
      const matchCat = selectedCategoryFilter === "ALL" || ch.category === selectedCategoryFilter;
      return matchSearch && matchProto && matchCat;
    });
  }, [channels, searchQuery, selectedProtocolFilter, selectedCategoryFilter]);

  // Aggregate stats
  const totalChannels = channels.length;
  const activeChannels = channels.filter((c) => c.status === "ONLINE" || c.status === "BUSY").length;
  const totalProcessedToday = channels.reduce((acc, c) => acc + c.processedToday, 0);
  const totalErrorsToday = channels.reduce((acc, c) => acc + c.errorCount, 0) + deadLetters.length;
  const avgLatency = Math.round(channels.reduce((acc, c) => acc + c.avgLatencyMs, 0) / channels.length);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="h-4 w-4 text-sky-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================
          HERALDIC MEDICAL COMMAND HEADER & REPUTATION ACCREDITATION STRIP
          (Light White Professional Hospital Design)
          =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all duration-300">
        {/* Subtle hospital ambient backlight */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-100/50 via-teal-50/40 to-transparent rounded-full pointer-events-none -mr-20 -mt-20 blur-3xl" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          
          {/* Left: Heraldic Medical Integration Engine Emblem & Title */}
          <div className="flex items-start gap-4">
            {/* Custom Healthcare Integration Heraldic Crest */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-teal-500 p-0.5 shadow-md flex-shrink-0">
              <div className="h-full w-full bg-white rounded-[14px] flex flex-col items-center justify-center p-1 text-center shadow-inner relative overflow-hidden">
                <div className="absolute -top-3 -right-3 h-8 w-8 bg-sky-100 rounded-full blur-xs pointer-events-none" />
                {/* SVG Medical Cross + High-Speed Data Matrix Nodes */}
                <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10 text-sky-600" fill="currentColor">
                  <path d="M11 2a1 1 0 0 1 2 0v7h7a1 1 0 0 1 0 2h-7v7a1 1 0 0 1-2 0v-7H4a1 1 0 0 1 0-2h7V2z" />
                  <circle cx="12" cy="11" r="2" className="text-teal-500" fill="#0d9488" />
                  <circle cx="4" cy="11" r="1.5" className="text-indigo-500" fill="#6366f1" />
                  <circle cx="20" cy="11" r="1.5" className="text-indigo-500" fill="#6366f1" />
                  <circle cx="12" cy="2" r="1.5" className="text-sky-500" fill="#0284c7" />
                  <circle cx="12" cy="20" r="1.5" className="text-sky-500" fill="#0284c7" />
                </svg>
                <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-800 leading-none mt-0.5">
                  NEXUS-MIE
                </span>
                <span className="text-[6.5px] font-bold text-sky-700 tracking-tighter">
                  CLINICAL MESH
                </span>
              </div>
            </div>

            {/* Title & Accreditation Badges */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Enterprise Gateway Active • 99.99% Routing SLA
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  <Award className="h-3 w-3 text-sky-600" />
                  NABL ISO 15189:2022 Certified
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <QrCode className="h-3 w-3 text-indigo-600" />
                  ABDM / ABHA HIP M1-M3 Gateway
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <ArrowLeftRight className="h-3 w-3 text-teal-600" />
                  HL7 v2.5 & ASTM E1394 Bi-Directional
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  HOSPITAL & DIAGNOSTIC INTEGRATION ENGINE
                  <span className="text-xs px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold border border-sky-200">
                    V14.8 PRO
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Central Interoperability Bus for Hospital HIS/EMR, Automated Analyzers (Roche, Sysmex, Mindray), ABDM National Gateway, Radiology PACS, and Critical Value Dispatch.
                </p>
              </div>

              {/* Supported Protocol Pills */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 flex-wrap">
                <span className="font-bold text-slate-800">Interfaced Protocols:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">HL7 MLLP:2575</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">ASTM RS232 / TCP</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">FHIR R4 JSON</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">DICOM MWL:104</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">WhatsApp Cloud</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">IoT MQTT:1883</span>
              </div>
            </div>
          </div>

          {/* Right: Telemetry Quick Counters & Live Pulse */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-start xl:items-end justify-between gap-3 flex-shrink-0">
            {/* Quick Health Stats Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Channels</p>
                <p className="text-lg font-black text-emerald-600 flex items-center justify-center gap-1">
                  {activeChannels} <span className="text-xs text-slate-400 font-semibold">/ {totalChannels}</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Packets Today</p>
                <p className="text-lg font-black text-sky-700">
                  {totalProcessedToday.toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Latency</p>
                <p className="text-lg font-black text-indigo-700">
                  {avgLatency} <span className="text-[10px] font-bold text-slate-500">ms</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DLQ Review</p>
                <p className={`text-lg font-black ${deadLetters.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {deadLetters.length}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                onClick={() => setLivePulseActive(!livePulseActive)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  livePulseActive
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${livePulseActive ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                <span>{livePulseActive ? "Live Stream ON" : "Stream Paused"}</span>
              </button>

              <button
                onClick={() => {
                  showToast("Flushing all channel buffers & polling active ports...");
                  setChannels((prev) =>
                    prev.map((c) => ({ ...c, lastHeartbeat: "Just now" }))
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
                <span>Sync Engine</span>
              </button>

              <button
                onClick={() => setActiveEngineTab("simulator")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Open Simulator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          SUB-NAVIGATION TABS (7 RICH SPECIALIZED VIEWS)
          =================================================================== */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveEngineTab("channels")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeEngineTab === "channels"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Server className="h-3.5 w-3.5 text-sky-600" />
            <span>Channel Matrix ({channels.length})</span>
          </button>

          <button
            onClick={() => setActiveEngineTab("stream")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeEngineTab === "stream"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            <span>Live Message Stream</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveEngineTab("simulator")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeEngineTab === "simulator"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Packet Sandbox & Simulator</span>
          </button>

          <button
            onClick={() => setActiveEngineTab("dlq")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeEngineTab === "dlq"
                ? "bg-white text-rose-700 shadow-xs border border-rose-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
            <span>Dead Letter Queue (DLQ)</span>
            {deadLetters.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px]">
                {deadLetters.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveEngineTab("mapping")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeEngineTab === "mapping"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-teal-600" />
            <span>LOINC & Code Crosswalk ({mappings.length})</span>
          </button>

          <button
            onClick={() => setActiveEngineTab("coldchain")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeEngineTab === "coldchain"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Thermometer className="h-3.5 w-3.5 text-cyan-600" />
            <span>IoT Cold-Chain Telemetry</span>
          </button>

          <button
            onClick={() => setActiveEngineTab("audit")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeEngineTab === "audit"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Compliance & Security Audit</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          TAB 1: CHANNEL MATRIX (LIVE HEALTHCARE PROTOCOL CHANNELS)
          =================================================================== */}
      {activeEngineTab === "channels" && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search channel name, code, port..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <select
                value={selectedProtocolFilter}
                onChange={(e) => setSelectedProtocolFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Protocols</option>
                <option value="HL7 v2.5.1">HL7 v2.5.1</option>
                <option value="ASTM E1394 / E1381">ASTM E1394 / E1381</option>
                <option value="ABDM M1-M3">ABDM M1-M3</option>
                <option value="DICOM / PACS">DICOM / PACS</option>
                <option value="WhatsApp Cloud API">WhatsApp Cloud API</option>
                <option value="IoT MQTT / LoRaWAN">IoT MQTT / LoRaWAN</option>
                <option value="REST Webhook">REST Webhook</option>
              </select>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer hidden sm:block"
              >
                <option value="ALL">All Domains</option>
                <option value="HIS_EMR">Hospital HIS / EMR</option>
                <option value="ANALYZER">Lab Analyzers</option>
                <option value="NATIONAL_ABDM">ABDM Gateway</option>
                <option value="RADIOLOGY">Radiology PACS</option>
                <option value="MESSAGING">Patient Communication</option>
                <option value="IOT_COLDCHAIN">Cold-Chain IoT</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 self-end md:self-auto">
              <span>Showing <strong>{filteredChannels.length}</strong> of {channels.length} channels</span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedProtocolFilter("ALL");
                  setSelectedCategoryFilter("ALL");
                }}
                className="text-sky-600 hover:text-sky-800 font-bold ml-1 hover:underline text-[11px]"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Channel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredChannels.map((ch) => {
              const isOnline = ch.status === "ONLINE" || ch.status === "BUSY";
              return (
                <div
                  key={ch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-xs p-5 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      ch.status === "BUSY"
                        ? "bg-sky-500"
                        : ch.status === "ONLINE"
                        ? "bg-emerald-500"
                        : ch.status === "STANDBY"
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                  />

                  <div>
                    {/* Header: Name, Code & Status */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {ch.code}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100">
                            {ch.protocol}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1 tracking-tight group-hover:text-sky-700 transition-colors">
                          {ch.name}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                          ch.status === "BUSY"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : ch.status === "ONLINE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ch.status === "STANDBY"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            ch.status === "BUSY"
                              ? "bg-sky-500 animate-spin"
                              : ch.status === "ONLINE"
                              ? "bg-emerald-500 animate-pulse"
                              : ch.status === "STANDBY"
                              ? "bg-amber-400"
                              : "bg-rose-500"
                          }`}
                        />
                        {ch.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {ch.description}
                    </p>

                    {/* Endpoint / Socket Details */}
                    <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Socket / Port:</span>
                        <span className="font-mono font-semibold text-slate-800">{ch.port}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] truncate">
                        <span className="text-slate-400 font-medium">URI Endpoint:</span>
                        <span className="font-mono text-slate-600 truncate max-w-[190px]" title={ch.endpoint}>
                          {ch.endpoint}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Throughput</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">
                          {ch.throughputPerMin} <span className="text-[9px] font-normal text-slate-400">m/min</span>
                        </p>
                      </div>

                      <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Latency</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">
                          {ch.avgLatencyMs} <span className="text-[9px] font-normal text-slate-400">ms</span>
                        </p>
                      </div>

                      <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Today</p>
                        <p className="text-xs font-black text-sky-700 mt-0.5">
                          {ch.processedToday}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {ch.lastHeartbeat}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleChannelStatus(ch.id)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          isOnline
                            ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                        title={isOnline ? "Pause Channel" : "Resume Channel"}
                      >
                        {isOnline ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
                      </button>

                      <button
                        onClick={() => handleRestartChannel(ch.id)}
                        className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition-all"
                        title="Flush Buffer & Ping"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveEngineTab("stream");
                          setSearchQuery(ch.code);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                      >
                        <span>View Packets</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 2: LIVE MESSAGE STREAM & PROTOCOL INSPECTOR
          =================================================================== */}
      {activeEngineTab === "stream" && (
        <div className="space-y-4">
          {/* Stream Top Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live Ingest Stream ({packets.length} packets)
              </span>

              <div className="relative w-full md:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter UHID, Barcode, Message Type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const demoPkt: StreamPacket = {
                    id: `pkt-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString("en-IN"),
                    channelId: "ch-analyzer-01",
                    channelName: "Roche Cobas c311",
                    protocol: "ASTM E1394 / E1381",
                    direction: "INBOUND",
                    messageType: "ASTM_RESULT (R)",
                    status: "PROCESSED",
                    patientUhid: "UHID-99014",
                    patientName: "Meenakshi Iyer",
                    sampleBarcode: "SMP-881920",
                    testAssay: "Serum Creatinine (1.1 mg/dL)",
                    rawPayload: `H|\\^&|||Roche^Cobas-c311|||||||P|1\nP|1||UHID-99014||Iyer^Meenakshi||F\nO|1|SMP-881920||^^^CREAT\nR|1|^^^CREAT|1.1|mg/dL|0.6-1.2|N||F\nL|1|N`,
                    parsedSummary: "Creatinine: 1.1 mg/dL (Normal). Directly posted to patient EMR sheet.",
                    latencyMs: 8,
                  };
                  setPackets((prev) => [demoPkt, ...prev]);
                  showToast("New live result packet ingested from Roche Cobas!");
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold border border-sky-200 flex items-center gap-1.5 shadow-2xs"
              >
                <Zap className="h-3 w-3 text-sky-600" />
                <span>Simulate Ingest</span>
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(packets, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `integration-packets-${Date.now()}.json`;
                  a.click();
                  showToast("Packet stream downloaded as JSON");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" />
                <span>Export Stream</span>
              </button>
            </div>
          </div>

          {/* Packets Stream Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Time & ID</th>
                    <th className="py-3 px-4">Channel & Protocol</th>
                    <th className="py-3 px-4">Direction / Type</th>
                    <th className="py-3 px-4">Patient / UHID</th>
                    <th className="py-3 px-4">Assay / Summary</th>
                    <th className="py-3 px-4">Status & Latency</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packets
                    .filter((p) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        p.patientUhid.toLowerCase().includes(q) ||
                        p.patientName.toLowerCase().includes(q) ||
                        p.sampleBarcode.toLowerCase().includes(q) ||
                        p.messageType.toLowerCase().includes(q) ||
                        p.testAssay.toLowerCase().includes(q)
                      );
                    })
                    .map((pkt) => (
                      <tr key={pkt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <span className="font-extrabold text-slate-800">{pkt.timestamp}</span>
                          <span className="block text-[10px] text-slate-400">{pkt.id}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{pkt.channelName}</span>
                          <span className="inline-block text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100 mt-0.5">
                            {pkt.protocol}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                pkt.direction === "INBOUND"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {pkt.direction}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">{pkt.messageType}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{pkt.patientName}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>{pkt.patientUhid}</span>
                            <span>•</span>
                            <span className="text-slate-600 font-bold">{pkt.sampleBarcode}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-semibold text-slate-900 block truncate">{pkt.testAssay}</span>
                          <span className="text-[11px] text-slate-500 truncate block">{pkt.parsedSummary}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pkt.status === "PROCESSED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : pkt.status === "FAILED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {pkt.status === "PROCESSED" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                              )}
                              {pkt.status}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{pkt.latencyMs}ms</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setInspectPacket(pkt)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-all inline-flex items-center gap-1"
                          >
                            <Terminal className="h-3 w-3 text-sky-600" />
                            <span>Inspect</span>
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

      {/* ===================================================================
          TAB 3: INTERACTIVE PACKET SIMULATOR & SANDBOX
          =================================================================== */}
      {activeEngineTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Simulation Configuration */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Clinical Protocol Test Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate realistic clinical transactions to validate MLLP, ASTM, FHIR, or ABDM message parsing without hardware.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                SANDBOX MODE
              </span>
            </div>

            {/* Simulation Type Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Simulation Scenario:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: "COBAS_RESULT",
                    title: "Roche Cobas ASTM Result",
                    desc: "Automated Chemistry / CLIA Result with Panic option",
                    proto: "ASTM E1394",
                  },
                  {
                    id: "SYSMEX_CBC",
                    title: "Sysmex Hematology CBC",
                    desc: "5-Part Diff numerical ingest with WBC/Hb",
                    proto: "ASTM COM3",
                  },
                  {
                    id: "HIS_ADT",
                    title: "Hospital HIS Patient Admit",
                    desc: "HL7 ADT-A01 Ward & Bed Admission sync",
                    proto: "HL7 v2.5",
                  },
                  {
                    id: "ABDM_SCAN",
                    title: "ABDM Scan & Share Check-in",
                    desc: "ABHA Token exchange at OPD Phlebotomy counter",
                    proto: "ABDM M1",
                  },
                  {
                    id: "STAT_PANIC",
                    title: "Emergency STAT Panic Alert",
                    desc: "Sub-15m critical value broadcast to ICU doctor",
                    proto: "REST Webhook",
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSimType(s.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      simType === s.id
                        ? "bg-sky-50/70 border-sky-400 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">{s.title}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {s.proto}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    value={simPatientName}
                    onChange={(e) => setSimPatientName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">UHID / MRN</label>
                  <input
                    type="text"
                    value={simUhid}
                    onChange={(e) => setSimUhid(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Specimen Barcode</label>
                  <input
                    type="text"
                    value={simBarcode}
                    onChange={(e) => setSimBarcode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Test Assay</label>
                  <input
                    type="text"
                    value={simTestAssay}
                    onChange={(e) => setSimTestAssay(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {simType === "COBAS_RESULT" && (
                <div className="grid grid-cols-2 gap-3 items-center pt-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                  <div>
                    <label className="text-[11px] font-bold text-amber-900 block mb-1">Assay Result Value</label>
                    <input
                      type="text"
                      value={simValue}
                      onChange={(e) => setSimValue(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simIsPanic}
                        onChange={(e) => setSimIsPanic(e.target.checked)}
                        className="rounded border-amber-400 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" /> Flag as Panic / STAT
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Trigger Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleExecuteSimulation}
                  disabled={simRunning}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className={`h-4 w-4 ${simRunning ? "animate-spin" : ""}`} />
                  <span>{simRunning ? "Dispatching & Parsing..." : "Dispatch Packet Into Integration Engine"}</span>
                </button>
              </div>

              {simSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{simSuccessMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Preview: Raw Protocol Wire Representation */}
          <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-sky-400" />
                  Live Wire Protocol Preview
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  ENCODING: ASCII / UTF-8
                </span>
              </div>

              <p className="text-xs text-slate-400">
                This shows the exact byte payload that will be transmitted over the socket or serial cable to the laboratory analyzer / HIS router.
              </p>

              {/* Code Pre Box */}
              <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-sky-300 overflow-x-auto border border-slate-800/80 max-h-80 scrollbar-thin">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {simType === "HIS_ADT"
                    ? `MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009123000||ADT^A01|MSG-8941|P|2.5.1
PID|1||${simUhid}^^^MRN||${simPatientName.replace(" ", "^")}||19850212|M
PV1|1|I|ICU^BED-02^BLOCK-A||||DOC-441^Dr. A. Mehra
DG1|1||I10^Essential Hypertension`
                    : simType === "COBAS_RESULT"
                    ? `<STX>1H|\\^&|||Roche^Cobas-c311|||||||P|1<CR><ETX>
<STX>2P|1||${simUhid}||${simPatientName.replace(" ", "^")}||M<CR><ETX>
<STX>3O|1|${simBarcode}||^^^K+|||||||A<CR><ETX>
<STX>4R|1|^^^K+|${simValue}|mmol/L|3.5-5.1|${simIsPanic ? "HH" : "N"}||F||||20261009123000<CR><ETX>
<STX>5L|1|N<CR><ETX>`
                    : simType === "SYSMEX_CBC"
                    ? `<STX>1H|\\^&|||Sysmex^XN-1000|||||||P|1<CR><ETX>
<STX>2P|1||${simUhid}||${simPatientName.replace(" ", "^")}<CR><ETX>
<STX>3O|1|${simBarcode}||^^^CBC<CR><ETX>
<STX>4R|1|^^^WBC|12.4|10^3/uL|4.0-11.0|H||F<CR><ETX>
<STX>5R|2|^^^HGB|14.2|g/dL|13.0-17.0|N||F<CR><ETX>
<STX>6L|1|N<CR><ETX>`
                    : simType === "ABDM_SCAN"
                    ? `{
  "context": "ABHA_FAST_TRACK_SCAN_SHARE",
  "abhaAddress": "${simPatientName.toLowerCase().replace(/[^a-z]/g, "")}@abdm",
  "abhaNumber": "91-8842-1029-4412",
  "name": "${simPatientName}",
  "counter": "OPD_PHLEBOTOMY_01"
}`
                    : `{
  "event": "CRITICAL_VALUE_ALERT",
  "channel": "STAT_EMERGENCY_DESK",
  "uhid": "${simUhid}",
  "patient": "${simPatientName}",
  "assay": "${simTestAssay}",
  "value": "${simValue}",
  "sub15mDoctorReadbackRequired": true
}`}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Standard: ISO 15189 & HL7 2.5 Compliance</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(simType);
                  showToast("Copied protocol sample to clipboard");
                }}
                className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 hover:underline"
              >
                <Copy className="h-3 w-3" /> Copy Payload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 4: DEAD LETTER QUEUE (DLQ) & ERROR AUTO-HEAL
          =================================================================== */}
      {activeEngineTab === "dlq" && (
        <div className="space-y-4">
          {/* DLQ Header Card */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-rose-950">
                  Dead Letter Queue & Channel Exceptions ({deadLetters.length} Unresolved)
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Unrouted packets due to missing UHIDs, unmapped analyzer test codes, or connection timeouts. Review and re-drive with 1-click auto-heal.
                </p>
              </div>
            </div>

            {deadLetters.length > 0 && (
              <button
                onClick={() => {
                  deadLetters.forEach((d) => handleRedriveDeadLetter(d.id));
                  showToast("Triggered batch re-drive for all DLQ packets!");
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Auto-Heal & Re-Drive All</span>
              </button>
            )}
          </div>

          {/* DLQ Items */}
          {deadLetters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">Dead Letter Queue is Completely Clear!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All inbound HIS orders, analyzer results, and ABDM exchanges are healthy and successfully delivered.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deadLetters.map((dl) => (
                <div
                  key={dl.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-rose-300 shadow-2xs p-5 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-xs">
                        {dl.id}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{dl.source}</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {dl.protocol} • {dl.payloadType}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 font-medium">{dl.timestamp}</span>
                  </div>

                  {/* Failure Reason & Fix */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 space-y-1.5">
                      <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                        Root Cause: {dl.errorReason}
                      </p>
                      <p className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 font-medium">
                        <strong>Suggested Fix:</strong> {dl.suggestedFix}
                      </p>
                    </div>

                    <div className="md:col-span-5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1 font-mono">
                      <div className="text-[11px] text-slate-600">
                        Patient: <strong>{dl.patientName}</strong> ({dl.uhid})
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Barcode: <strong>{dl.sampleBarcode}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Raw: {dl.rawMessage.slice(0, 50)}...
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setInspectDeadLetter(dl)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      View Raw Payload
                    </button>

                    <button
                      onClick={() => handleRedriveDeadLetter(dl.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Auto-Heal & Re-Drive</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          TAB 5: UNIVERSAL LOINC & TEST CODE CROSSWALK STUDIO
          =================================================================== */}
      {activeEngineTab === "mapping" && (
        <div className="space-y-4">
          {/* Header & Add Button */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-teal-600" />
                Universal Test Code & LOINC Crosswalk Studio
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Maps Hospital HIS Requisitions ⇄ Laboratory Analyzer Codes ⇄ Standard LOINC & SNOMED CT Codes.
              </p>
            </div>

            <button
              onClick={() => setIsAddMappingOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
            >
              <span>+ Add New Test Mapping</span>
            </button>
          </div>

          {/* Mapping Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Local Code</th>
                    <th className="py-3 px-4">Clinical Test Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Analyzer Code</th>
                    <th className="py-3 px-4">Standard LOINC</th>
                    <th className="py-3 px-4">HIS Billing Code</th>
                    <th className="py-3 px-4">Unit & Specimen</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">
                        {m.localCode}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {m.localName}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {m.department}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {m.analyzerCode}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">
                        {m.loincCode}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {m.hisBillingCode}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {m.unit} • <span className="text-[10px] text-slate-400">{m.sampleType}</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Active
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

      {/* ===================================================================
          TAB 6: IOT COLD-CHAIN & SAMPLE TELEMETRY MONITOR
          =================================================================== */}
      {activeEngineTab === "coldchain" && (
        <div className="space-y-4">
          <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-cyan-950">
                  NABL ISO 15189 Cold-Chain & Environmental Telemetry
                </h3>
                <p className="text-xs text-cyan-800 mt-0.5">
                  Automated LoRaWAN & MQTT IoT temperature monitoring for specimen refrigerators, plasma freezers, and B2B transit boxes.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-cyan-900 bg-white px-3 py-1.5 rounded-xl border border-cyan-200 shadow-2xs">
              4 Active Sensors • 100% Within Safe Range
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {sensors.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.location}</span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">{s.unitName}</h4>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">Current Temp</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">
                      {s.temperatureC > 0 ? `+${s.temperatureC}` : s.temperatureC}°C
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400">Safe Limit</p>
                    <p className="text-xs font-bold text-slate-700 mt-1 font-mono">{s.targetRange}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Battery: <strong>{s.batteryPct}%</strong> ({s.powerSource === "MAINS_AC" ? "Mains AC" : "Battery"})</span>
                  <span className="text-[10px] text-slate-400">{s.lastPing}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 7: COMPLIANCE, SECURITY & AUDIT TRAIL
          =================================================================== */}
      {activeEngineTab === "audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              NABL ISO 15189 & ABDM Security Validation Matrix
            </h3>

            <div className="space-y-3">
              {[
                {
                  standard: "NABL ISO 15189:2022 (Clause 5.3)",
                  title: "Laboratory Information Management System (LIMS) Validation",
                  desc: "Automated verification that analyzer raw data is ingested without unauthorized manual alteration.",
                  status: "COMPLIANT",
                },
                {
                  standard: "ABDM Milestone 1-3 Certification",
                  title: "National Health Authority Interoperability Gateway",
                  desc: "AES-256 encrypted FHIR R4 Bundle exchange with verified Digital Health IDs.",
                  status: "COMPLIANT",
                },
                {
                  standard: "HL7 MLLP TLS 1.3 Transport Security",
                  title: "Socket Layer End-to-End Hospital Encryption",
                  desc: "Port 2575 guarded by mutual TLS (mTLS) with SHA-256 certificate pinning.",
                  status: "ENFORCED",
                },
                {
                  standard: "Critical Value Verbal Read-back Audit",
                  title: "Sub-15 Minute Panic Notification Compliance",
                  desc: "Cryptographic timestamp recording when doctor was informed and acknowledged verbally.",
                  status: "AUDITED",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {item.standard}
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {item.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 pt-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Cryptographic Audit Log</span>
              <span className="text-[10px] text-slate-400 font-mono">SHA-256 CHAIN</span>
            </h3>

            <div className="space-y-2 text-xs font-mono text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>12:28:45 IST</span>
                  <span className="text-emerald-600 font-bold">VERIFIED</span>
                </div>
                <p className="text-slate-800 font-semibold">COBAS_RESULT #89241 Ingested</p>
                <p className="text-[9px] text-slate-400 truncate">Hash: 8f9b4c19a...3e82d</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>12:28:10 IST</span>
                  <span className="text-emerald-600 font-bold">VERIFIED</span>
                </div>
                <p className="text-slate-800 font-semibold">HIS_ORM #9421 Inpatient Order</p>
                <p className="text-[9px] text-slate-400 truncate">Hash: 4a21e8d91...09f21</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>12:26:55 IST</span>
                  <span className="text-emerald-600 font-bold">VERIFIED</span>
                </div>
                <p className="text-slate-800 font-semibold">ABDM_M3 FHIR Bundle Export</p>
                <p className="text-[9px] text-slate-400 truncate">Hash: e31248ba0...78a11</p>
              </div>
            </div>

            <button
              onClick={() => showToast("Exported verified audit trail report (PDF)")}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <FileCheck className="h-3.5 w-3.5 text-sky-600" />
              <span>Export NABL Audit Report (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: RAW PACKET INSPECTOR DRAWER
          =================================================================== */}
      {inspectPacket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  {inspectPacket.protocol} • {inspectPacket.messageType}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Protocol Packet Inspector: {inspectPacket.id}
                </h3>
              </div>

              <button
                onClick={() => setInspectPacket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">Patient</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{inspectPacket.patientName}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">UHID</p>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">{inspectPacket.patientUhid}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">Barcode</p>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">{inspectPacket.sampleBarcode}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">Latency</p>
                  <p className="font-bold text-slate-900 mt-0.5">{inspectPacket.latencyMs} ms</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Raw Protocol Wire Frame:
                </label>
                <div className="bg-slate-950 text-sky-300 font-mono text-xs p-4 rounded-xl overflow-x-auto border border-slate-800">
                  <pre className="whitespace-pre-wrap">{inspectPacket.rawPayload}</pre>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  LIS Parsed Interpretation:
                </label>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {inspectPacket.parsedSummary}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inspectPacket.rawPayload);
                  showToast("Raw payload copied to clipboard");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Payload</span>
              </button>

              <button
                onClick={() => setInspectPacket(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: ADD NEW TEST CODE MAPPING
          =================================================================== */}
      {isAddMappingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  DICTIONARY CROSSWALK
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Add Clinical Test Code Mapping
                </h3>
              </div>
              <button
                onClick={() => setIsAddMappingOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewMapping} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Local Test Code</label>
                <input
                  type="text"
                  placeholder="e.g. BIO_LIPID_CHOL"
                  value={newMapLocalCode}
                  onChange={(e) => setNewMapLocalCode(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500 uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Test Name</label>
                <input
                  type="text"
                  placeholder="e.g. Total Cholesterol (Serum)"
                  value={newMapLocalName}
                  onChange={(e) => setNewMapLocalName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Analyzer Raw Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CHOL_ENZ"
                    value={newMapAnalyzerCode}
                    onChange={(e) => setNewMapAnalyzerCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">LOINC Standard Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 2093-3"
                    value={newMapLoinc}
                    onChange={(e) => setNewMapLoinc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reporting Unit</label>
                <input
                  type="text"
                  placeholder="e.g. mg/dL"
                  value={newMapUnit}
                  onChange={(e) => setNewMapUnit(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMappingOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Save Code Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
