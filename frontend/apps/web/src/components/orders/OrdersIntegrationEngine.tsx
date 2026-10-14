"use client";

import React, { useState, useMemo } from "react";
import {
  Server,
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
  Lock,
  FileCheck,
  FlaskConical,
  TestTube,
  PackageCheck,
  Split,
  GitBranch,
  Barcode,
  SlidersHorizontal,
  ClipboardList
} from "lucide-react";

// =========================================================================
// TYPES & INTERFACES FOR ORDERS INTEGRATION ENGINE
// =========================================================================

export type OrderProtocol =
  | "HL7 v2.5 ORM_O01"
  | "FHIR R4 ServiceRequest"
  | "ABDM e-Prescription"
  | "B2B REST Webhook"
  | "ASTM E1394 Worklist"
  | "DICOM Modality Worklist";

export type OrderChannelStatus = "ONLINE" | "BUSY" | "STANDBY" | "ATTENTION";

export interface OrderFeedChannel {
  id: string;
  name: string;
  sourceType: "HIS_WARD" | "OPD_DESK" | "ABDM_GOV" | "B2B_FRANCHISE" | "PORTAL_KIOSK" | "ANALYZER_WORKLIST";
  protocol: OrderProtocol;
  endpoint: string;
  port: string;
  status: OrderChannelStatus;
  ordersReceivedToday: number;
  avgParseLatencyMs: number;
  lastOrderReceived: string;
  description: string;
  autoAcknowledgeAck: boolean;
}

export interface InboundOrderPacket {
  id: string;
  timestamp: string;
  channelId: string;
  channelName: string;
  protocol: OrderProtocol;
  orderNumber: string;
  patientUhid: string;
  patientName: string;
  orderingDoctor: string;
  department: string;
  priority: "ROUTINE" | "URGENT" | "STAT_EMERGENCY";
  orderedAssays: string[];
  allocatedTubes: string[];
  status: "ROUTED_TO_PHLEBOTOMY" | "WORKLIST_QUEUED" | "EXCEPTION_HELD" | "PARSED_SUCCESS";
  rawHL7Payload: string;
  parseNotes: string;
  latencyMs: number;
}

export interface ReflexRule {
  id: string;
  ruleName: string;
  primaryAssay: string;
  triggerCondition: string;
  reflexActionAssay: string;
  department: string;
  status: "ACTIVE" | "PAUSED";
  autoAuthorizedBy: string;
  clinicalRationale: string;
}

export interface OrderDeadLetter {
  id: string;
  timestamp: string;
  source: string;
  orderNumber: string;
  uhid: string;
  patientName: string;
  exceptionReason: string;
  rawPayload: string;
  suggestedAction: string;
}

export interface SpecimenContainerRule {
  testCode: string;
  testName: string;
  tubeType: string;
  capColor: string;
  colorName: string;
  minVolumeMl: number;
  handlingTemp: string;
}

// =========================================================================
// MOCK DATA GENERATION (HOSPITAL, LAB & CLINIC STANDARDS)
// =========================================================================

const initialOrderChannels: OrderFeedChannel[] = [
  {
    id: "ord-ch-his-ward",
    name: "Central HIS Inpatient Ward Requisitions",
    sourceType: "HIS_WARD",
    protocol: "HL7 v2.5 ORM_O01",
    endpoint: "mllp://his.apex-hospital.local:2575",
    port: "MLLP Port :2575",
    status: "ONLINE",
    ordersReceivedToday: 218,
    avgParseLatencyMs: 12,
    lastOrderReceived: "Just now",
    description: "Inbound doctor orders from ICU, NICU, Post-Op, and General Wards (ORM^O01). Auto-extracts UHID, Bed #, Doctor.",
    autoAcknowledgeAck: true,
  },
  {
    id: "ord-ch-opd-desk",
    name: "Consultant OPD Doctor E-Prescription Desk",
    sourceType: "OPD_DESK",
    protocol: "HL7 v2.5 ORM_O01",
    endpoint: "https://opd-emr.apex-hospital.local/api/orders",
    port: "HTTPS REST :443",
    status: "BUSY",
    ordersReceivedToday: 412,
    avgParseLatencyMs: 8,
    lastOrderReceived: "2s ago",
    description: "Real-time doctor prescription sync from OPD consulting suites. Auto-populates clinical history & provisional diagnosis.",
    autoAcknowledgeAck: true,
  },
  {
    id: "ord-ch-abdm",
    name: "ABDM / ABHA Digital Prescription Gateway",
    sourceType: "ABDM_GOV",
    protocol: "ABDM e-Prescription",
    endpoint: "https://gateway.abdm.gov.in/v0.5/prescriptions",
    port: "FHIR R4 TLS 1.3 :443",
    status: "ONLINE",
    ordersReceivedToday: 84,
    avgParseLatencyMs: 160,
    lastOrderReceived: "45s ago",
    description: "Government Ayushman Bharat ABHA digital prescription intake (FHIR ServiceRequest). Links Care Context automatically.",
    autoAcknowledgeAck: true,
  },
  {
    id: "ord-ch-b2b",
    name: "Franchise & B2B Sub-Lab Batch Requisition Bridge",
    sourceType: "B2B_FRANCHISE",
    protocol: "B2B REST Webhook",
    endpoint: "https://b2b.apex-diagnostics.com/api/v2/order-feed",
    port: "REST API :8443",
    status: "ONLINE",
    ordersReceivedToday: 135,
    avgParseLatencyMs: 42,
    lastOrderReceived: "3m ago",
    description: "Bulk specimen intake from external clinics and collection annexes. Synchronizes pre-printed sample barcodes.",
    autoAcknowledgeAck: true,
  },
  {
    id: "ord-ch-analyzer-wl",
    name: "Bidirectional Analyzer Worklist Broadcast",
    sourceType: "ANALYZER_WORKLIST",
    protocol: "ASTM E1394 Worklist",
    endpoint: "tcp://worklist-bus.local:5000",
    port: "TCP Socket :5000 / :5001",
    status: "ONLINE",
    ordersReceivedToday: 380,
    avgParseLatencyMs: 14,
    lastOrderReceived: "Just now",
    description: "Pushes pending test orders to Roche Cobas c311 and Sysmex XN-1000 worklist queues before specimen arrival.",
    autoAcknowledgeAck: true,
  },
  {
    id: "ord-ch-stat-lane",
    name: "Emergency Casualty STAT Priority Expressway",
    sourceType: "HIS_WARD",
    protocol: "HL7 v2.5 ORM_O01",
    endpoint: "mllp://stat-lane.apex-hospital.local:2576",
    port: "STAT Priority :2576",
    status: "ONLINE",
    ordersReceivedToday: 34,
    avgParseLatencyMs: 5,
    lastOrderReceived: "Just now",
    description: "Dedicated low-latency socket for Casualty & Trauma resuscitation bay with auto-flagged 15-minute sub-TAT alarms.",
    autoAcknowledgeAck: true,
  },
];

const initialInboundPackets: InboundOrderPacket[] = [
  {
    id: "ord-pkt-101",
    timestamp: "12:38:15",
    channelId: "ord-ch-his-ward",
    channelName: "Central HIS Inpatient Ward",
    protocol: "HL7 v2.5 ORM_O01",
    orderNumber: "ORD-99120",
    patientUhid: "UHID-89241",
    patientName: "Sunita Verma",
    orderingDoctor: "Dr. A. Mehra, MD (Cardiology)",
    department: "ICU Block A - Bed 04",
    priority: "STAT_EMERGENCY",
    orderedAssays: ["High Sensitivity Troponin-I", "Serum Potassium", "CBC 5-Diff"],
    allocatedTubes: ["Lavender EDTA (3mL)", "Gold SST Gel (5mL)", "Green Heparin (3mL)"],
    status: "ROUTED_TO_PHLEBOTOMY",
    rawHL7Payload: `MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009123810||ORM^O01|MSG-99120|P|2.5.1\nPID|1||UHID-89241^^^MRN||Verma^Sunita||19820412|F\nPV1|1|I|ICU^BED-04^BLOCK-A||||DOC-441^Dr. A. Mehra\nORC|NW|ORD-99120|||||^^^20261009123800|||DOC-441\nOBR|1|ORD-99120||TROP_I_HS^Troponin-I Rapid||||||||||||DOC-441\nOBR|2|ORD-99120||BIO_POTASS^Serum Potassium||||||||||||DOC-441\nOBR|3|ORD-99120||CBC^Complete Blood Count||||||||||||DOC-441`,
    parseNotes: "Emergency STAT order parsed. Allocated 3 collection tubes. Phlebotomist alert dispatched.",
    latencyMs: 9,
  },
  {
    id: "ord-pkt-102",
    timestamp: "12:36:40",
    channelId: "ord-ch-opd-desk",
    channelName: "Consultant OPD Doctor Desk",
    protocol: "HL7 v2.5 ORM_O01",
    orderNumber: "ORD-99119",
    patientUhid: "UHID-77219",
    patientName: "Rajesh Malhotra",
    orderingDoctor: "Dr. Sandeep Deshmukh, MD",
    department: "OPD Suite #12",
    priority: "ROUTINE",
    orderedAssays: ["Liver Function Test (LFT)", "Kidney Function Test (KFT)", "Lipid Profile"],
    allocatedTubes: ["Gold SST Gel (5mL)"],
    status: "WORKLIST_QUEUED",
    rawHL7Payload: `MSH|^~\\&|APEX_OPD|CLINIC|LABCORE|PATHOLOGY|20261009123635||ORM^O01|MSG-99119|P|2.5.1\nPID|1||UHID-77219^^^MRN||Malhotra^Rajesh||19780512|M\nPV1|1|O|OPD^ROOM-12\nORC|NW|ORD-99119\nOBR|1|ORD-99119||LFT^Liver Function Test\nOBR|2|ORD-99119||KFT^Kidney Function Test\nOBR|3|ORD-99119||LIPID^Lipid Profile Panel`,
    parseNotes: "All 3 serum biochemistry panels consolidated into a single Gold SST Gel collection tube.",
    latencyMs: 11,
  },
  {
    id: "ord-pkt-103",
    timestamp: "12:35:10",
    channelId: "ord-ch-abdm",
    channelName: "ABDM / ABHA Digital Gateway",
    protocol: "ABDM e-Prescription",
    orderNumber: "ORD-ABHA-441",
    patientUhid: "UHID-63110",
    patientName: "Arun Kulkarni",
    orderingDoctor: "Dr. Sneha Joshi (Govt Civil Hospital)",
    department: "National Health Mission Tele-Consult",
    priority: "ROUTINE",
    orderedAssays: ["Glycated Hemoglobin (HbA1c)", "Fasting Blood Sugar"],
    allocatedTubes: ["Lavender EDTA (3mL)", "Grey Fluoride (2mL)"],
    status: "ROUTED_TO_PHLEBOTOMY",
    rawHL7Payload: `{\n  \"resourceType\": \"ServiceRequest\",\n  \"id\": \"ORD-ABHA-441\",\n  \"status\": \"active\",\n  \"intent\": \"order\",\n  \"code\": {\n    \"coding\": [\n      { \"system\": \"http://loinc.org\", \"code\": \"4548-4\", \"display\": \"HbA1c\" },\n      { \"system\": \"http://loinc.org\", \"code\": \"1558-6\", \"display\": \"Glucose Fasting\" }\n    ]\n  },\n  \"subject\": { \"reference\": \"Patient/ABHA-91-4491-8921\" }\n}`,
    parseNotes: "FHIR ServiceRequest translated into LIS Order. Patient verified with ABHA KYC.",
    latencyMs: 145,
  },
  {
    id: "ord-pkt-104",
    timestamp: "12:32:05",
    channelId: "ord-ch-his-ward",
    channelName: "Central HIS Inpatient Ward",
    protocol: "HL7 v2.5 ORM_O01",
    orderNumber: "ORD-99118",
    patientUhid: "UHID-94102",
    patientName: "Kavita Rao",
    orderingDoctor: "Dr. R. K. Singhania, MS (Ortho)",
    department: "Post-Op Ward 3 - Bed 14",
    priority: "URGENT",
    orderedAssays: ["Coagulation Profile (PT/INR/APTT)", "Complete Blood Count"],
    allocatedTubes: ["Light Blue Citrate (2.7mL)", "Lavender EDTA (3mL)"],
    status: "PARSED_SUCCESS",
    rawHL7Payload: `MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009123200||ORM^O01|MSG-99118|P|2.5.1\nPID|1||UHID-94102||Rao^Kavita||F\nPV1|1|I|POSTOP^BED-14^WARD-3\nOBR|1|||PT_INR^Prothrombin Time\nOBR|2|||CBC^Complete Blood Count`,
    parseNotes: "Pre-surgical coagulation panel order parsed. Tube volumes verified.",
    latencyMs: 10,
  },
];

const initialReflexRules: ReflexRule[] = [
  {
    id: "rfx-01",
    ruleName: "Thyroid Reflex Cascade (TSH → Free T4)",
    primaryAssay: "TSH (Thyroid Stimulating Hormone)",
    triggerCondition: "TSH > 10.0 uIU/mL OR TSH < 0.1 uIU/mL",
    reflexActionAssay: "Free Thyroxine (FT4) & Anti-TPO Antibodies",
    department: "Clinical Endocrinology",
    status: "ACTIVE",
    autoAuthorizedBy: "Dr. Sandeep Deshmukh, MD Path",
    clinicalRationale: "NABL & ATA clinical protocol: abnormal TSH automatically triggers FT4 to establish overt vs subclinical thyroiditis.",
  },
  {
    id: "rfx-02",
    ruleName: "Severe Thrombocytopenia Manual Smear Review",
    primaryAssay: "Platelet Count (Automated Sysmex)",
    triggerCondition: "Platelet Count < 50,000 /uL",
    reflexActionAssay: "Peripheral Blood Smear Pathologist Review (PBS)",
    department: "Hematology & Cytology",
    status: "ACTIVE",
    autoAuthorizedBy: "Dr. Sandeep Deshmukh, MD Path",
    clinicalRationale: "Excludes EDTA-induced platelet satellitism & pseudothrombocytopenia before reporting critical panic low values.",
  },
  {
    id: "rfx-03",
    ruleName: "Suspected Acute MI (CPK-MB → Trop-I)",
    primaryAssay: "Creatine Kinase-MB (CPK-MB)",
    triggerCondition: "CPK-MB > 25 U/L (Elevated Cardiac Isoenzyme)",
    reflexActionAssay: "High Sensitivity Troponin-I (STAT)",
    department: "Emergency Biochemistry",
    status: "ACTIVE",
    autoAuthorizedBy: "Apex Cardiology Protocol Committee",
    clinicalRationale: "Provides sub-15m definitive cardiac biomarker confirmation for emergency casualty patients.",
  },
  {
    id: "rfx-04",
    ruleName: "Urinary Tract Infection Pyuria Reflex",
    primaryAssay: "Urine Routine (Leukocyte Esterase / WBCs)",
    triggerCondition: "WBC > 15 /HPF OR Nitrite Positive",
    reflexActionAssay: "Urine Culture & Antibiotic Susceptibility (AST)",
    department: "Microbiology",
    status: "ACTIVE",
    autoAuthorizedBy: "Hospital Infection Control Committee",
    clinicalRationale: "Automatic reflex culture ensures prompt antimicrobial stewardship and eliminates repeat sample collection.",
  },
];

const initialOrderExceptions: OrderDeadLetter[] = [
  {
    id: "ord-dlq-01",
    timestamp: "12:20:14",
    source: "Apex Central HIS (HL7 Port :2575)",
    orderNumber: "ORD-99115",
    uhid: "UHID-UNREGISTERED",
    patientName: "Emergency Casualty Walk-in (Unknown)",
    exceptionReason: "Missing UHID: Order arrived from Casualty with provisional barcode but no hospital registration record.",
    rawPayload: `MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009122010||ORM^O01|MSG-99115|P|2.5.1\nPID|1||^^^MRN||Walk-in^Trauma||M\nOBR|1|||BLOOD_GROUP^Blood Grouping & Cross Match (STAT)`,
    suggestedAction: "Assign temporary Emergency Trauma UHID 'TR-CAS-99' and route directly to Blood Bank.",
  },
  {
    id: "ord-dlq-02",
    timestamp: "11:42:30",
    source: "North City B2B Referral Annex",
    orderNumber: "B2B-ORD-449",
    uhid: "UHID-71092",
    patientName: "Ramesh Joshi",
    exceptionReason: "Unmapped Test Code: Received code 'LFT_SPECIAL_EXT' from third-party clinic software.",
    rawPayload: `{\n  \"b2bClient\": \"NORTH_CITY_CLINIC\",\n  \"testCode\": \"LFT_SPECIAL_EXT\",\n  \"uhid\": \"UHID-71092\"\n}`,
    suggestedAction: "Map 'LFT_SPECIAL_EXT' to LIS Master Code 'LFT' (Liver Function Test Comprehensive Panel).",
  },
];

const containerGuidelines: SpecimenContainerRule[] = [
  {
    testCode: "CBC",
    testName: "Complete Blood Count / ESR",
    tubeType: "Lavender Top (K2/K3 EDTA)",
    capColor: "#8B5CF6",
    colorName: "Lavender",
    minVolumeMl: 3.0,
    handlingTemp: "Room Temp (18-25°C)",
  },
  {
    testCode: "BIO_CHEM",
    testName: "LFT, KFT, Lipids, Cardiac Enzymes",
    tubeType: "Gold Top (SST Gel Separator)",
    capColor: "#F59E0B",
    colorName: "Gold SST",
    minVolumeMl: 5.0,
    handlingTemp: "Centrifuge within 2h, 4°C",
  },
  {
    testCode: "GLU_FAST",
    testName: "Fasting / PP Blood Glucose",
    tubeType: "Grey Top (Sodium Fluoride)",
    capColor: "#64748B",
    colorName: "Grey Fluoride",
    minVolumeMl: 2.0,
    handlingTemp: "Room Temp (18-25°C)",
  },
  {
    testCode: "COAG",
    testName: "PT/INR, APTT, D-Dimer",
    tubeType: "Light Blue Top (Sodium Citrate 3.2%)",
    capColor: "#0284C7",
    colorName: "Light Blue Citrate",
    minVolumeMl: 2.7,
    handlingTemp: "Exact fill required (9:1 ratio)",
  },
  {
    testCode: "IMMUNO",
    testName: "Troponin-I, Blood Gas, Rapid STAT",
    tubeType: "Green Top (Lithium Heparin)",
    capColor: "#10B981",
    colorName: "Green Heparin",
    minVolumeMl: 3.0,
    handlingTemp: "Immediate analysis",
  },
  {
    testCode: "URINE",
    testName: "Urine Routine, Microscopy & Culture",
    tubeType: "Yellow Sterile Screw-Cap Cup",
    capColor: "#EAB308",
    colorName: "Sterile Cup",
    minVolumeMl: 20.0,
    handlingTemp: "Refrigerate if > 1h",
  },
];

// =========================================================================
// MAIN COMPONENT: ORDERS INTEGRATION ENGINE
// =========================================================================

interface OrdersIntegrationEngineProps {
  onInjectOrderToWorklist?: (order: InboundOrderPacket) => void;
}

export default function OrdersIntegrationEngine({
  onInjectOrderToWorklist,
}: OrdersIntegrationEngineProps) {
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    "channels" | "stream" | "simulator" | "reflex" | "containers" | "exceptions"
  >("channels");

  // State
  const [channels, setChannels] = useState<OrderFeedChannel[]>(initialOrderChannels);
  const [inboundPackets, setInboundPackets] = useState<InboundOrderPacket[]>(initialInboundPackets);
  const [reflexRules, setReflexRules] = useState<ReflexRule[]>(initialReflexRules);
  const [exceptions, setExceptions] = useState<OrderDeadLetter[]>(initialOrderExceptions);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  // Simulator Form State
  const [simScenario, setSimScenario] = useState<"ICU_STAT" | "OPD_COMBO" | "ABDM_E_RX" | "B2B_BATCH">("ICU_STAT");
  const [simPatientName, setSimPatientName] = useState("Vikramaditya Rao");
  const [simUhid, setSimUhid] = useState("UHID-99214");
  const [simDoctor, setSimDoctor] = useState("Dr. Ananya Roy, MD");
  const [simWardBed, setSimWardBed] = useState("ICU Bed 06");
  const [simAssays, setSimAssays] = useState("Troponin-I STAT, Serum Electrolytes, Blood Gas");
  const [simIsStat, setSimIsStat] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simResultSuccess, setSimResultSuccess] = useState<string | null>(null);

  // Raw Packet Inspector Drawer Modal
  const [inspectPacket, setInspectPacket] = useState<InboundOrderPacket | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Toggle Channel Status
  const handleToggleChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        const nextStatus: OrderChannelStatus = ch.status === "ONLINE" || ch.status === "BUSY" ? "STANDBY" : "ONLINE";
        showToast(`Channel "${ch.name}" updated to ${nextStatus}`);
        return { ...ch, status: nextStatus };
      })
    );
  };

  // Toggle Reflex Rule Status
  const handleToggleReflexRule = (ruleId: string) => {
    setReflexRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const nextStatus = r.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        showToast(`Reflex Rule "${r.ruleName}" set to ${nextStatus}`);
        return { ...r, status: nextStatus };
      })
    );
  };

  // Execute Simulation
  const handleRunOrderSimulation = () => {
    setSimulating(true);
    setSimResultSuccess(null);

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

      const newPacket: InboundOrderPacket = {
        id: `ord-pkt-${Date.now()}`,
        timestamp: timeStr,
        channelId: simScenario === "ICU_STAT" ? "ord-ch-stat-lane" : simScenario === "ABDM_E_RX" ? "ord-ch-abdm" : "ord-ch-his-ward",
        channelName: simScenario === "ICU_STAT" ? "Casualty STAT Priority Expressway" : simScenario === "ABDM_E_RX" ? "ABDM e-Prescription" : "Central HIS Inpatient",
        protocol: simScenario === "ABDM_E_RX" ? "ABDM e-Prescription" : "HL7 v2.5 ORM_O01",
        orderNumber: orderNum,
        patientUhid: simUhid,
        patientName: simPatientName,
        orderingDoctor: simDoctor,
        department: simWardBed,
        priority: simIsStat ? "STAT_EMERGENCY" : "ROUTINE",
        orderedAssays: simAssays.split(",").map((s) => s.trim()),
        allocatedTubes: simIsStat ? ["Green Heparin (3mL)", "Gold SST (5mL)"] : ["Lavender EDTA (3mL)", "Gold SST (5mL)"],
        status: "ROUTED_TO_PHLEBOTOMY",
        rawHL7Payload: `MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|${now.toISOString()}||ORM^O01|${orderNum}|P|2.5.1\nPID|1||${simUhid}^^^MRN||${simPatientName.replace(" ", "^")}||M\nPV1|1|I|${simWardBed}\nORC|NW|${orderNum}|||||^^^${now.toISOString()}|||${simDoctor}\nOBR|1|${orderNum}||SIM_ASSAYS^${simAssays}||||||||||||${simDoctor}`,
        parseNotes: `Simulated requisition created. Auto-split into collection vials. Dispatched to Phlebotomy queue.`,
        latencyMs: 8,
      };

      setInboundPackets((prev) => [newPacket, ...prev]);
      setSimulating(false);
      setSimResultSuccess(`Successfully injected simulated requisition ${orderNum} into laboratory intake pipeline!`);
      showToast(`Order ${orderNum} created & routed to phlebotomy!`);

      // If parent supplied callback, notify parent
      if (onInjectOrderToWorklist) {
        onInjectOrderToWorklist(newPacket);
      }
    }, 600);
  };

  // Re-drive Exception
  const handleResolveException = (excId: string) => {
    const item = exceptions.find((e) => e.id === excId);
    if (!item) return;

    showToast(`Resolved exception for ${item.orderNumber}. Re-injecting into Orders Queue...`);
    setExceptions((prev) => prev.filter((e) => e.id !== excId));

    const resolvedPacket: InboundOrderPacket = {
      id: `ord-pkt-rec-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("en-IN"),
      channelId: "ord-ch-his-ward",
      channelName: "Auto-Heal Engine",
      protocol: "HL7 v2.5 ORM_O01",
      orderNumber: item.orderNumber,
      patientUhid: item.uhid === "UHID-UNREGISTERED" ? "UHID-TR-CAS-99 (Temporary)" : item.uhid,
      patientName: item.patientName,
      orderingDoctor: "Emergency Casualty Resident",
      department: "Casualty Resuscitation Bay",
      priority: "STAT_EMERGENCY",
      orderedAssays: ["Blood Grouping & Crossmatch (STAT)"],
      allocatedTubes: ["Lavender EDTA (3mL)", "Red Plain (5mL)"],
      status: "ROUTED_TO_PHLEBOTOMY",
      rawHL7Payload: item.rawPayload,
      parseNotes: `Resolved from Dead Letter Queue. Action applied: "${item.suggestedAction}"`,
      latencyMs: 12,
    };

    setInboundPackets((prev) => [resolvedPacket, ...prev]);
  };

  // Aggregate metrics
  const totalReceivedToday = channels.reduce((acc, c) => acc + c.ordersReceivedToday, 0);
  const activeFeedsCount = channels.filter((c) => c.status === "ONLINE" || c.status === "BUSY").length;
  const statOrdersCount = inboundPackets.filter((p) => p.priority === "STAT_EMERGENCY").length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="h-4 w-4 text-sky-400" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* ===================================================================
          HERALDIC MEDICAL COMMAND HEADER & ORDERS INTEROPERABILITY EMBLEM
          (Clean Light White Professional Hospital Aesthetic)
          =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-100/50 via-indigo-50/40 to-transparent rounded-full pointer-events-none -mr-20 -mt-20 blur-3xl" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          
          {/* Left: Heraldic Medical Order Engine Emblem & Title */}
          <div className="flex items-start gap-4">
            {/* Custom Healthcare Orders Integration Emblem */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-teal-500 p-0.5 shadow-md flex-shrink-0">
              <div className="h-full w-full bg-white rounded-[14px] flex flex-col items-center justify-center p-1 text-center shadow-inner relative overflow-hidden">
                <div className="absolute -top-3 -right-3 h-8 w-8 bg-sky-100 rounded-full blur-xs pointer-events-none" />
                <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10 text-sky-600" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" />
                  <circle cx="18" cy="6" r="2" fill="#0d9488" />
                </svg>
                <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-800 leading-none mt-0.5">
                  ORD-ROUTER
                </span>
                <span className="text-[6.5px] font-bold text-sky-700 tracking-tighter">
                  CLINICAL REQ
                </span>
              </div>
            </div>

            {/* Title & Accreditation Badges */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Requisition Feed Active • 0 Loss Ingest
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  <Award className="h-3 w-3 text-sky-600" />
                  NABL ISO 15189:2022 Requisition Custody
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <QrCode className="h-3 w-3 text-indigo-600" />
                  ABDM e-Prescription (FHIR R4)
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <Split className="h-3 w-3 text-teal-600" />
                  Auto Tube Allocator & Color Coder
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  ORDERS & REQUISITIONS INTEGRATION ENGINE
                  <span className="text-xs px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold border border-sky-200">
                    ENTERPRISE V14.8
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Automated clinical order routing connecting Hospital HIS/EMR Wards (HL7 ORM), OPD Doctor Desks, ABDM e-Prescriptions, and bi-directional Analyzer Worklists.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 flex-wrap">
                <span className="font-bold text-slate-800">Inbound Channels:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">HL7 ORM MLLP:2575</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">OPD REST :443</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">ABDM ServiceRequest</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">B2B Franchise Batch</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">ASTM Analyzer Worklists</span>
              </div>
            </div>
          </div>

          {/* Right: Real-time Telemetry Stats */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-start xl:items-end justify-between gap-3 flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Feeds</p>
                <p className="text-lg font-black text-emerald-600 flex items-center justify-center gap-1">
                  {activeFeedsCount} <span className="text-xs text-slate-400 font-semibold">/ {channels.length}</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders Today</p>
                <p className="text-lg font-black text-sky-700">
                  {totalReceivedToday.toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STAT Urgent</p>
                <p className="text-lg font-black text-rose-600">
                  {statOrdersCount}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exceptions</p>
                <p className={`text-lg font-black ${exceptions.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {exceptions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  showToast("Flushed order feed buffers & synchronized HIS sockets");
                  setChannels((prev) =>
                    prev.map((c) => ({ ...c, lastOrderReceived: "Just now" }))
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
                <span>Sync Order Sockets</span>
              </button>

              <button
                onClick={() => setActiveSubTab("simulator")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Simulate Doctor Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          SUB-NAVIGATION TABS (6 CLINICAL ORDER DOMAINS)
          =================================================================== */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab("channels")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeSubTab === "channels"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Server className="h-3.5 w-3.5 text-sky-600" />
            <span>Order Gateways ({channels.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("stream")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeSubTab === "stream"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            <span>Inbound Order Stream</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubTab("simulator")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeSubTab === "simulator"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Doctor Order Simulator</span>
          </button>

          <button
            onClick={() => setActiveSubTab("reflex")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeSubTab === "reflex"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5 text-purple-600" />
            <span>Reflex & Cascade Protocols ({reflexRules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("containers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeSubTab === "containers"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TestTube className="h-3.5 w-3.5 text-teal-600" />
            <span>Tube Allocation & Color Coder</span>
          </button>

          <button
            onClick={() => setActiveSubTab("exceptions")}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeSubTab === "exceptions"
                ? "bg-white text-rose-700 shadow-xs border border-rose-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
            <span>Order Exceptions (DLQ)</span>
            {exceptions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px]">
                {exceptions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===================================================================
          TAB 1: ORDER CHANNELS & GATEWAY FEEDS
          =================================================================== */}
      {activeSubTab === "channels" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {channels.map((ch) => {
              const isOnline = ch.status === "ONLINE" || ch.status === "BUSY";
              return (
                <div
                  key={ch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-xs p-5 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      ch.status === "BUSY"
                        ? "bg-sky-500"
                        : ch.status === "ONLINE"
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    }`}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100">
                            {ch.protocol}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1 tracking-tight group-hover:text-sky-700 transition-colors">
                          {ch.name}
                        </h3>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                          ch.status === "BUSY"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : ch.status === "ONLINE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            ch.status === "BUSY"
                              ? "bg-sky-500 animate-spin"
                              : ch.status === "ONLINE"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-amber-400"
                          }`}
                        />
                        {ch.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                      {ch.description}
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Socket / Port:</span>
                        <span className="font-mono font-semibold text-slate-800">{ch.port}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] truncate">
                        <span className="text-slate-400 font-medium">Endpoint:</span>
                        <span className="font-mono text-slate-600 truncate max-w-[190px]" title={ch.endpoint}>
                          {ch.endpoint}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                      <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Orders Today</p>
                        <p className="text-sm font-black text-sky-700 mt-0.5">{ch.ordersReceivedToday}</p>
                      </div>
                      <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Parse Latency</p>
                        <p className="text-sm font-black text-slate-800 mt-0.5">{ch.avgParseLatencyMs} ms</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {ch.lastOrderReceived}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleChannel(ch.id)}
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
                        onClick={() => {
                          setActiveSubTab("stream");
                          setSearchQuery(ch.name);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                      >
                        <span>View Orders</span>
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
          TAB 2: INBOUND ORDER STREAM & HL7 ORM INSPECTOR
          =================================================================== */}
      {activeSubTab === "stream" && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live Inbound Requisition Stream ({inboundPackets.length})
              </span>

              <div className="relative w-full md:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter UHID, Order #, Doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="STAT_EMERGENCY">🚨 STAT Emergency</option>
                <option value="URGENT">Urgent</option>
                <option value="ROUTINE">Routine</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(inboundPackets, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `order-stream-${Date.now()}.json`;
                  a.click();
                  showToast("Order stream exported as JSON");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" />
                <span>Export Stream</span>
              </button>
            </div>
          </div>

          {/* Stream Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Time & Order #</th>
                    <th className="py-3 px-4">Patient / UHID</th>
                    <th className="py-3 px-4">Doctor & Department</th>
                    <th className="py-3 px-4">Ordered Tests & Assays</th>
                    <th className="py-3 px-4">Allocated Tubes</th>
                    <th className="py-3 px-4">Priority / Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inboundPackets
                    .filter((p) => {
                      if (filterPriority !== "ALL" && p.priority !== filterPriority) return false;
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        p.orderNumber.toLowerCase().includes(q) ||
                        p.patientUhid.toLowerCase().includes(q) ||
                        p.patientName.toLowerCase().includes(q) ||
                        p.orderingDoctor.toLowerCase().includes(q)
                      );
                    })
                    .map((pkt) => (
                      <tr key={pkt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <span className="font-extrabold text-slate-900 block">{pkt.orderNumber}</span>
                          <span className="text-[10px] text-slate-400">{pkt.timestamp}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{pkt.patientName}</span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">{pkt.patientUhid}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{pkt.orderingDoctor}</span>
                          <span className="text-[10px] text-slate-500">{pkt.department}</span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {pkt.orderedAssays.map((a, i) => (
                              <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {pkt.allocatedTubes.map((t, i) => (
                              <span key={i} className="text-[9px] font-bold bg-sky-50 text-sky-800 px-1.5 py-0.2 rounded border border-sky-100">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {pkt.priority === "STAT_EMERGENCY" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <Flame className="h-3 w-3 text-rose-600" /> STAT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                                {pkt.priority}
                              </span>
                            )}
                            <span className="block text-[10px] font-semibold text-emerald-700">
                              {pkt.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setInspectPacket(pkt)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-all inline-flex items-center gap-1"
                          >
                            <Terminal className="h-3 w-3 text-sky-600" />
                            <span>Inspect HL7</span>
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
          TAB 3: INTERACTIVE DOCTOR ORDER SIMULATOR & TEST SANDBOX
          =================================================================== */}
      {activeSubTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Clinical Requisition Test Sandbox
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate hospital orders arriving from Wards, OPDs, or ABDM to test auto tube allocation and LIS routing.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                SANDBOX INGEST
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Order Scenario:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: "ICU_STAT", title: "ICU / Trauma STAT Order", desc: "Emergency Casualty with sub-15m TAT requirement" },
                  { id: "OPD_COMBO", title: "OPD Consulting Combo", desc: "Routine LFT, KFT, Lipid Profile tube bundling" },
                  { id: "ABDM_E_RX", title: "ABHA e-Prescription (M1)", desc: "National Health Authority FHIR ServiceRequest" },
                  { id: "B2B_BATCH", title: "B2B Franchise Specimen Batch", desc: "Remote clinic specimen barcode sync" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSimScenario(s.id as any);
                      if (s.id === "ICU_STAT") {
                        setSimAssays("High Sensitivity Troponin-I, Serum Potassium, Blood Gas");
                        setSimIsStat(true);
                      } else if (s.id === "OPD_COMBO") {
                        setSimAssays("LFT Panel, KFT Panel, Lipid Profile");
                        setSimIsStat(false);
                      } else {
                        setSimAssays("HbA1c, Fasting Blood Glucose");
                        setSimIsStat(false);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      simScenario === s.id
                        ? "bg-sky-50/70 border-sky-400 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-extrabold text-xs text-slate-900">{s.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

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
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Ordering Doctor</label>
                  <input
                    type="text"
                    value={simDoctor}
                    onChange={(e) => setSimDoctor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Ward / Location</label>
                  <input
                    type="text"
                    value={simWardBed}
                    onChange={(e) => setSimWardBed(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Ordered Assays (Comma Separated)</label>
                <input
                  type="text"
                  value={simAssays}
                  onChange={(e) => setSimAssays(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={simIsStat}
                    onChange={(e) => setSimIsStat(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-rose-600" />
                    Flag as High-Urgency STAT Emergency (Sub-15m Alarm)
                  </span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleRunOrderSimulation}
                  disabled={simulating}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className={`h-4 w-4 ${simulating ? "animate-spin" : ""}`} />
                  <span>{simulating ? "Injecting Order..." : "Transmit Order Into Integration Engine"}</span>
                </button>
              </div>

              {simResultSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{simResultSuccess}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-sky-400" />
                  Wire Protocol Representation (HL7 ORM_O01)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  STANDARD: HL7 v2.5.1
                </span>
              </div>

              <p className="text-xs text-slate-400">
                This shows the exact pipe-delimited segment structure created by the hospital ordering physician's terminal:
              </p>

              <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-sky-300 overflow-x-auto border border-slate-800/80 max-h-80 scrollbar-thin">
                <pre className="whitespace-pre-wrap leading-relaxed">
{`MSH|^~\\&|APEX_HIS|HOSPITAL|LABCORE|PATHOLOGY|20261009124000||ORM^O01|MSG-99214|P|2.5.1
PID|1||${simUhid}^^^MRN||${simPatientName.replace(" ", "^")}||M
PV1|1|I|${simWardBed}||||DOC-441^${simDoctor}
ORC|NW|ORD-99214|||||^^^20261009124000|||DOC-441
${simAssays.split(",").map((a, i) => `OBR|${i + 1}|ORD-99214||${a.trim().toUpperCase().replace(/ /g, "_")}^${a.trim()}||||||||||||DOC-441`).join("\n")}`}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Automatic Tube Split: <strong>Lavender EDTA + Gold SST</strong></span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(simAssays);
                  showToast("Copied protocol preview to clipboard");
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
          TAB 4: REFLEX & CASCADE TESTING RULES MATRIX
          =================================================================== */}
      {activeSubTab === "reflex" && (
        <div className="space-y-4">
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-purple-950">
                  Automated Reflex & Cascade Testing Rules Studio
                </h3>
                <p className="text-xs text-purple-800 mt-0.5">
                  Algorithms that automatically cascade confirmatory tests when initial values meet clinical trigger criteria, without requiring a second doctor prescription.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-purple-900 bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs">
              {reflexRules.filter((r) => r.status === "ACTIVE").length} Rules Live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reflexRules.map((rule) => {
              const isActive = rule.status === "ACTIVE";
              return (
                <div
                  key={rule.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5 hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {rule.department}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">{rule.ruleName}</h4>
                      </div>

                      <button
                        onClick={() => handleToggleReflexRule(rule.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                          isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        {isActive ? "ACTIVE" : "PAUSED"}
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Initial Test:</span>
                        <span className="font-bold text-slate-900">{rule.primaryAssay}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Condition:</span>
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          {rule.triggerCondition}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-purple-700 font-bold flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" /> Auto-Cascade:
                        </span>
                        <span className="font-extrabold text-purple-900">{rule.reflexActionAssay}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      &quot;{rule.clinicalRationale}&quot;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Authorized by: <strong>{rule.autoAuthorizedBy}</strong></span>
                    <span className="font-mono">{rule.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 5: SPECIMEN TUBE ALLOCATION & COLOR CODER
          =================================================================== */}
      {activeSubTab === "containers" && (
        <div className="space-y-4">
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <TestTube className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-teal-950">
                  Intelligent Tube Allocation & Phlebotomy Color-Coding Engine
                </h3>
                <p className="text-xs text-teal-800 mt-0.5">
                  Consolidates multiple clinical orders into minimal phlebotomy tube draws with strict NABL container protocols.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-teal-900 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
              ISO 15189 Specimen Integrity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {containerGuidelines.map((c, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3 hover:border-teal-300 transition-all"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full shadow-xs border border-white"
                      style={{ backgroundColor: c.capColor }}
                    />
                    <h4 className="font-extrabold text-sm text-slate-900">{c.colorName}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {c.testCode}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-800">{c.tubeType}</p>
                  <p className="text-slate-500">{c.testName}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Min Blood Draw</span>
                    <span className="font-black text-slate-900">{c.minVolumeMl} mL</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">Handling Protocol</span>
                    <span className="font-medium text-slate-700 text-[11px]">{c.handlingTemp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 6: ORDER DEAD LETTER QUEUE (DLQ) & EXCEPTIONS
          =================================================================== */}
      {activeSubTab === "exceptions" && (
        <div className="space-y-4">
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-rose-950">
                  Order Ingest Dead Letter Queue ({exceptions.length} Exceptions)
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Inbound hospital requisitions blocked due to missing patient registrations or unmapped test codes.
                </p>
              </div>
            </div>

            {exceptions.length > 0 && (
              <button
                onClick={() => {
                  exceptions.forEach((e) => handleResolveException(e.id));
                  showToast("Batch resolved all order exceptions!");
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Auto-Resolve & Route All</span>
              </button>
            )}
          </div>

          {exceptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">All Inbound Order Feeds are Healthy!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders are stalled. All doctor test orders have successfully routed to laboratory worklists.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exceptions.map((exc) => (
                <div
                  key={exc.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-rose-300 shadow-2xs p-5 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-xs">
                        {exc.orderNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{exc.source}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({exc.timestamp})</span>
                    </div>

                    <span className="text-xs text-slate-600 font-medium">
                      Patient: <strong>{exc.patientName}</strong> ({exc.uhid})
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                      Exception: {exc.exceptionReason}
                    </p>
                    <p className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 font-medium">
                      <strong>Recommended Solution:</strong> {exc.suggestedAction}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleResolveException(exc.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Apply Fix & Route to Phlebotomy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          MODAL: HL7 RAW PACKET INSPECTOR
          =================================================================== */}
      {inspectPacket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  {inspectPacket.protocol} • {inspectPacket.orderNumber}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  HL7 Order Message Inspector: {inspectPacket.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectPacket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">Patient</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{inspectPacket.patientName}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">Doctor</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{inspectPacket.orderingDoctor}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">Department</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{inspectPacket.department}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">Latency</p>
                  <p className="font-bold text-slate-900 mt-0.5">{inspectPacket.latencyMs} ms</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Raw HL7 ORM Wire Segments:
                </label>
                <div className="bg-slate-950 text-sky-300 font-mono text-xs p-4 rounded-xl overflow-x-auto border border-slate-800">
                  <pre className="whitespace-pre-wrap">{inspectPacket.rawHL7Payload}</pre>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Diagnostic Routing Summary:
                </label>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {inspectPacket.parseNotes}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inspectPacket.rawHL7Payload);
                  showToast("Copied raw HL7 segments to clipboard");
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
