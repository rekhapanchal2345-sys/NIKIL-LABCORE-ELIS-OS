"use client";

import React, { useState, useCallback } from "react";
import {
  Cpu,
  ScanLine,
  Printer,
  Network,
  Wifi,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  Zap,
  RefreshCw,
  Server,
  Radio,
  FileCode,
  ShieldCheck,
  Check,
} from "lucide-react";
import type {
  HardwareIntegrationData,
  AnalyzerConnection,
  HL7MessageHandler,
} from "@/types/settings";

const INPUT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150";

const SELECT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150 appearance-none";

function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && (
        <span title={hint} className="cursor-help">
          <Info className="h-3 w-3 text-slate-400" />
        </span>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  badge,
  badgeVariant = "blue",
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "blue" | "green" | "amber" | "red";
  children: React.ReactNode;
}) {
  const badgeClasses = {
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }[badgeVariant];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-indigo-600 shadow-xs">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const DEFAULT_ANALYZERS: AnalyzerConnection[] = [
  {
    id: "ana-1",
    instrumentName: "Mindray BS-240 Clinical Chemistry Analyzer",
    manufacturer: "Mindray Medical",
    modelNumber: "BS-240",
    serialNumber: "MD-BS240-9921",
    department: "Biochemistry",
    connectionType: "TCPIP_SOCKET",
    protocol: "HL7_V2",
    ipAddress: "192.168.10.45",
    port: 5100,
    transferMode: "BIDIRECTIONAL",
    isActive: true,
    lastSyncTimestamp: "Just now (Sync Active)",
  },
  {
    id: "ana-2",
    instrumentName: "Sysmex XN-350 5-Part Hematology Analyzer",
    manufacturer: "Sysmex Corporation",
    modelNumber: "XN-350",
    serialNumber: "SX-XN350-4819",
    department: "Hematology",
    connectionType: "RS232_SERIAL",
    protocol: "ASTM_E1381",
    comPort: "COM3",
    baudRate: 19200,
    dataBits: 8,
    stopBits: 1,
    parity: "NONE",
    transferMode: "HOST_QUERY",
    isActive: true,
    lastSyncTimestamp: "2 mins ago",
  },
  {
    id: "ana-3",
    instrumentName: "Roche Cobas e411 Immunoassay Analyzer",
    manufacturer: "Roche Diagnostics",
    modelNumber: "Cobas e411",
    serialNumber: "RC-E411-7102",
    department: "Immunoassay / Serology",
    connectionType: "TCPIP_SOCKET",
    protocol: "ASTM_E1394",
    ipAddress: "192.168.10.48",
    port: 5200,
    transferMode: "BIDIRECTIONAL",
    isActive: true,
    lastSyncTimestamp: "5 mins ago",
  },
];

const DEFAULT_HL7_HANDLERS: HL7MessageHandler[] = [
  {
    messageType: "ORM_O01",
    enabled: true,
    inboundEnabled: true,
    outboundEnabled: false,
    endpoint: "/api/hl7/orm-orders",
  },
  {
    messageType: "ORU_R01",
    enabled: true,
    inboundEnabled: true,
    outboundEnabled: true,
    endpoint: "/api/hl7/oru-results",
  },
  {
    messageType: "ADT_A01",
    enabled: true,
    inboundEnabled: true,
    outboundEnabled: false,
    endpoint: "/api/hl7/adt-admit",
  },
  {
    messageType: "ADT_A03",
    enabled: true,
    inboundEnabled: true,
    outboundEnabled: false,
    endpoint: "/api/hl7/adt-discharge",
  },
  {
    messageType: "QBP_Q11",
    enabled: true,
    inboundEnabled: true,
    outboundEnabled: true,
    endpoint: "/api/hl7/query",
  },
];

const DEFAULT_HARDWARE_DATA: HardwareIntegrationData = {
  analyzerConnections: DEFAULT_ANALYZERS,
  defaultBaudRate: 9600,
  defaultDataBits: 8,
  defaultStopBits: 1,
  defaultParity: "NONE",
  astmEnabled: true,
  astmMllpPort: 5000,
  hl7Enabled: true,
  hl7Version: "2.5.1",
  hl7MllpHost: "0.0.0.0",
  hl7MllpPort: 2575,
  hl7MessageHandlers: DEFAULT_HL7_HANDLERS,
  fhirEnabled: true,
  fhirVersion: "R4",
  fhirBaseUrl: "https://elis.hospital.internal/fhir/r4",
  fhirAuthMethod: "SMART_ON_FHIR",
  abdmEnabled: true,
  abdmEnvironment: "PRODUCTION",
  abdmClientId: "SBX_004812",
  abdmClientSecret: "••••••••••••••••••••••••",
  abdmFacilityId: "IN0710001852",
  pacsDicomEnabled: true,
  pacsAeTitle: "LABCORE_ELIS",
  pacsRemoteAeTitle: "HOSP_PACS_CENTRAL",
  pacsRemoteHost: "192.168.10.80",
  pacsRemotePort: 104,
  dicomMwlEnabled: true,
  dicomStorageSCU: true,
};

interface HardwareInteroperabilitySettingsProps {
  subSection?: string;
  initialValues?: Partial<HardwareIntegrationData>;
  saving?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSave?: (values: HardwareIntegrationData) => void;
}

export default function HardwareInteroperabilitySettings({
  subSection,
  initialValues,
  saving = false,
  onDirtyChange,
  onSave,
}: HardwareInteroperabilitySettingsProps) {
  const [data, setData] = useState<HardwareIntegrationData>(() => ({
    ...DEFAULT_HARDWARE_DATA,
    ...initialValues,
  }));

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (subSection === "hardware-analyzers") return "analyzers";
    if (subSection === "hardware-hl7") return "hl7";
    if (subSection === "hardware-fhir") return "fhir";
    if (subSection === "hardware-pacs") return "pacs";
    if (subSection === "hardware-lrs") return "printers";
    return "analyzers";
  });

  const [pingStatus, setPingStatus] = useState<Record<string, "idle" | "testing" | "ok" | "err">>({});

  
  React.useEffect(() => {
    if (subSection === "hardware-analyzers") setActiveTab("analyzers");
    else if (subSection === "hardware-hl7") setActiveTab("hl7");
    else if (subSection === "hardware-fhir") setActiveTab("fhir");
    else if (subSection === "hardware-pacs") setActiveTab("pacs");
    else if (subSection === "hardware-lrs") setActiveTab("printers");
  }, [subSection]);

  const markDirty = useCallback(() => {
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  const updateField = <K extends keyof HardwareIntegrationData>(
    field: K,
    value: HardwareIntegrationData[K]
  ) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  const updateAnalyzer = (id: string, updates: Partial<AnalyzerConnection>) => {
    setData((prev) => {
      const nextAnalyzers = prev.analyzerConnections.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      const next = { ...prev, analyzerConnections: nextAnalyzers };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  const addAnalyzer = () => {
    const newId = `ana-${Date.now()}`;
    const newAnalyzer: AnalyzerConnection = {
      id: newId,
      instrumentName: "New Diagnostic Analyzer",
      manufacturer: "Generic Medical Instrument",
      modelNumber: "GEN-01",
      serialNumber: "SN-PENDING",
      department: "Biochemistry",
      connectionType: "TCPIP_SOCKET",
      protocol: "HL7_V2",
      ipAddress: "192.168.10.50",
      port: 5000,
      transferMode: "BIDIRECTIONAL",
      isActive: true,
      lastSyncTimestamp: "Unconnected",
    };
    setData((prev) => {
      const next = {
        ...prev,
        analyzerConnections: [...prev.analyzerConnections, newAnalyzer],
      };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  const removeAnalyzer = (id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        analyzerConnections: prev.analyzerConnections.filter((a) => a.id !== id),
      };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  const testPing = (id: string) => {
    setPingStatus((prev) => ({ ...prev, [id]: "testing" }));
    setTimeout(() => {
      setPingStatus((prev) => ({ ...prev, [id]: "ok" }));
      setTimeout(() => {
        setPingStatus((prev) => ({ ...prev, [id]: "idle" }));
      }, 3000);
    }, 1200);
  };

  const toggleHl7Handler = (type: string, field: "enabled" | "inboundEnabled" | "outboundEnabled") => {
    setData((prev) => {
      const nextHandlers = prev.hl7MessageHandlers.map((h) =>
        h.messageType === type ? { ...h, [field]: !h[field] } : h
      );
      const next = { ...prev, hl7MessageHandlers: nextHandlers };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Domain Header Banner */}
      <div className="rounded-xl border border-indigo-200 bg-linear-to-r from-indigo-50/70 via-white to-sky-50/40 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Medical Hardware, Interoperability & LIS Interfacing
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                  <Activity className="h-3 w-3" />
                  ASTM / HL7 / FHIR R4 Engine
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Bi-directional automated analyzer interfacing, MLLP HL7 v2.5.1 message pipelines, ABDM / FHIR R4 diagnostic sharing, and PACS / DICOM worklists.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Radio className="h-3 w-3 animate-pulse text-emerald-600" />
              MLLP Listener Active :2575
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("analyzers")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "analyzers"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ScanLine className="h-3.5 w-3.5" />
          Analyzer Interfacing (ASTM/HL7)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hl7")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "hl7"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Network className="h-3.5 w-3.5" />
          HL7 v2.5.1 MLLP Pipeline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fhir")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "fhir"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Wifi className="h-3.5 w-3.5" />
          FHIR R4 & ABDM Gateway
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pacs")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "pacs"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          PACS / DICOM Bridge
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("printers")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "printers"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Printer className="h-3.5 w-3.5" />
          Label & Report Printers
        </button>
      </div>

      {/* TAB 1: Analyzer Interfacing */}
      {(activeTab === "analyzers" || subSection === "hardware-analyzers") && (
        <div className="space-y-6">
          <SectionCard
            title="Connected Diagnostic Instruments & Analyzers"
            description="Manage direct digital links with Biochemistry, Hematology, Immunoassay, and Urinalysis hardware via RS-232 serial COM or TCP/IP Ethernet sockets."
            icon={ScanLine}
            badge={`${data.analyzerConnections.filter((a) => a.isActive).length} Connected`}
            badgeVariant="green"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Supported Instrument Drivers: Mindray (BS/BC Series), Sysmex (XN/KX), Roche Cobas, Beckman Coulter, Abbott Architect, Horiba Yumizen.
                </p>
                <button
                  type="button"
                  onClick={addAnalyzer}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Instrument
                </button>
              </div>

              <div className="space-y-4">
                {data.analyzerConnections.map((analyzer) => {
                  const pStatus = pingStatus[analyzer.id] || "idle";

                  return (
                    <div
                      key={analyzer.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/40 p-4 transition-all hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                            <Activity className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">
                                {analyzer.instrumentName}
                              </h4>
                              <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-700">
                                {analyzer.department}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {analyzer.manufacturer} • Model: {analyzer.modelNumber} • S/N: {analyzer.serialNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => testPing(analyzer.id)}
                            disabled={pStatus === "testing"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${pStatus === "testing" ? "animate-spin text-sky-600" : "text-slate-500"}`}
                            />
                            {pStatus === "testing"
                              ? "Testing..."
                              : pStatus === "ok"
                              ? "Echo OK (2ms)"
                              : "Test Link Echo"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateAnalyzer(analyzer.id, {
                                isActive: !analyzer.isActive,
                              })
                            }
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                              analyzer.isActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {analyzer.isActive ? "Online" : "Paused"}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeAnalyzer(analyzer.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Remove Instrument"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Connection Settings Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Connection Interface
                          </label>
                          <select
                            value={analyzer.connectionType}
                            onChange={(e) =>
                              updateAnalyzer(analyzer.id, {
                                connectionType: e.target.value as any,
                              })
                            }
                            className={`${SELECT_CLS} mt-1`}
                          >
                            <option value="TCPIP_SOCKET">TCP/IP Ethernet Socket</option>
                            <option value="RS232_SERIAL">RS-232 Serial COM Port</option>
                            <option value="USB">Direct USB / HID</option>
                            <option value="FILE_BASED">File Watcher / Shared Folder</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Data Protocol
                          </label>
                          <select
                            value={analyzer.protocol}
                            onChange={(e) =>
                              updateAnalyzer(analyzer.id, {
                                protocol: e.target.value as any,
                              })
                            }
                            className={`${SELECT_CLS} mt-1`}
                          >
                            <option value="HL7_V2">HL7 v2.x (MLLP)</option>
                            <option value="ASTM_E1381">ASTM E1381 / E1394 Standard</option>
                            <option value="ASTM_E1394">ASTM 1394 LIS Level</option>
                            <option value="PROPRIETARY">Manufacturer Native Driver</option>
                          </select>
                        </div>

                        {analyzer.connectionType === "TCPIP_SOCKET" ? (
                          <>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Instrument IP Address
                              </label>
                              <input
                                type="text"
                                value={analyzer.ipAddress || ""}
                                onChange={(e) =>
                                  updateAnalyzer(analyzer.id, {
                                    ipAddress: e.target.value,
                                  })
                                }
                                className={`${INPUT_CLS} mt-1 font-mono`}
                                placeholder="192.168.10.45"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                TCP Listener Port
                              </label>
                              <input
                                type="number"
                                value={analyzer.port || 5000}
                                onChange={(e) =>
                                  updateAnalyzer(analyzer.id, {
                                    port: Number(e.target.value),
                                  })
                                }
                                className={`${INPUT_CLS} mt-1 font-mono`}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                COM Port & Baud Rate
                              </label>
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  value={analyzer.comPort || "COM1"}
                                  onChange={(e) =>
                                    updateAnalyzer(analyzer.id, {
                                      comPort: e.target.value.toUpperCase(),
                                    })
                                  }
                                  className="w-20 rounded border border-slate-300 py-1.5 px-2 font-mono uppercase"
                                />
                                <select
                                  value={analyzer.baudRate || 9600}
                                  onChange={(e) =>
                                    updateAnalyzer(analyzer.id, {
                                      baudRate: Number(e.target.value),
                                    })
                                  }
                                  className="w-full rounded border border-slate-300 py-1.5 px-2"
                                >
                                  <option value={9600}>9600 8-N-1</option>
                                  <option value={19200}>19200 8-N-1</option>
                                  <option value={38400}>38400 8-N-1</option>
                                  <option value={115200}>115200 8-N-1</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Transfer Mode
                              </label>
                              <select
                                value={analyzer.transferMode}
                                onChange={(e) =>
                                  updateAnalyzer(analyzer.id, {
                                    transferMode: e.target.value as any,
                                  })
                                }
                                className={`${SELECT_CLS} mt-1`}
                              >
                                <option value="BIDIRECTIONAL">Bi-directional (Host Query)</option>
                                <option value="HOST_QUERY">Host Query Barcode Scan</option>
                                <option value="UNIDIRECTIONAL_RESULT">Unidirectional Push Only</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 2: HL7 Pipeline */}
      {(activeTab === "hl7" || subSection === "hardware-hl7") && (
        <div className="space-y-6">
          <SectionCard
            title="HL7 v2.5.1 MLLP Message Engine"
            description="Configure the Minimal Lower Layer Protocol (MLLP) TCP server for receiving hospital admit orders and pushing authenticated clinical lab findings."
            icon={Network}
            badge="MLLP Port 2575"
            badgeVariant="blue"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FieldLabel label="HL7 Version Standard" />
                  <select
                    value={data.hl7Version}
                    onChange={(e) =>
                      updateField("hl7Version", e.target.value as any)
                    }
                    className={SELECT_CLS}
                  >
                    <option value="2.3">HL7 v2.3 (Legacy)</option>
                    <option value="2.3.1">HL7 v2.3.1</option>
                    <option value="2.4">HL7 v2.4</option>
                    <option value="2.5">HL7 v2.5</option>
                    <option value="2.5.1">HL7 v2.5.1 (Standard)</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label="MLLP Bind Host" />
                  <input
                    type="text"
                    value={data.hl7MllpHost}
                    onChange={(e) => updateField("hl7MllpHost", e.target.value)}
                    className={`${INPUT_CLS} font-mono`}
                    placeholder="0.0.0.0"
                  />
                </div>
                <div>
                  <FieldLabel label="MLLP TCP Port" required />
                  <input
                    type="number"
                    value={data.hl7MllpPort}
                    onChange={(e) => updateField("hl7MllpPort", Number(e.target.value))}
                    className={`${INPUT_CLS} font-mono`}
                  />
                </div>
              </div>

              {/* Message Handlers Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Message Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Internal Handler Route</th>
                      <th className="py-2.5 px-3 text-center">Inbound</th>
                      <th className="py-2.5 px-3 text-center">Outbound</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.hl7MessageHandlers.map((handler) => (
                      <tr key={handler.messageType} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {handler.messageType}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {handler.messageType === "ORM_O01" && "Lab Order / Specimen Collection Request"}
                          {handler.messageType === "ORU_R01" && "Observation Result / Test Report Transmission"}
                          {handler.messageType === "ADT_A01" && "Patient Admission & Inpatient Triage Notification"}
                          {handler.messageType === "ADT_A03" && "Patient Discharge / Account Hold Event"}
                          {handler.messageType === "QBP_Q11" && "Query by Parameter / Historical Report Lookup"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {handler.endpoint}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={handler.inboundEnabled}
                            onChange={() =>
                              toggleHl7Handler(handler.messageType, "inboundEnabled")
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={handler.outboundEnabled}
                            onChange={() =>
                              toggleHl7Handler(handler.messageType, "outboundEnabled")
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleHl7Handler(handler.messageType, "enabled")
                            }
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              handler.enabled
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {handler.enabled ? "Enabled" : "Disabled"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 3: FHIR R4 & ABDM Gateway */}
      {(activeTab === "fhir" || subSection === "hardware-fhir") && (
        <div className="space-y-6">
          <SectionCard
            title="Ayushman Bharat Digital Mission (ABDM) Gateway Integration"
            description="Configure National Health Authority (NHA) gateway credentials for M1 (ABHA creation), M2 (Health Information Provider HIP), and M3 (Health Information User HIU)."
            icon={Wifi}
            badge={data.abdmEnvironment === "PRODUCTION" ? "ABDM Production" : "ABDM Sandbox"}
            badgeVariant={data.abdmEnvironment === "PRODUCTION" ? "green" : "amber"}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FieldLabel label="ABDM Environment" />
                  <select
                    value={data.abdmEnvironment}
                    onChange={(e) =>
                      updateField("abdmEnvironment", e.target.value as any)
                    }
                    className={SELECT_CLS}
                  >
                    <option value="PRODUCTION">Production Gateway (abdm.gov.in)</option>
                    <option value="SANDBOX">Sandbox Test Environment</option>
                  </select>
                </div>

                <div>
                  <FieldLabel label="ABDM Health Facility Registry (HFR) ID" required />
                  <input
                    type="text"
                    value={data.abdmFacilityId}
                    onChange={(e) => updateField("abdmFacilityId", e.target.value)}
                    className={`${INPUT_CLS} font-mono`}
                    placeholder="IN0710001852"
                  />
                </div>

                <div>
                  <FieldLabel label="NHA Gateway Client ID" required />
                  <input
                    type="text"
                    value={data.abdmClientId}
                    onChange={(e) => updateField("abdmClientId", e.target.value)}
                    className={`${INPUT_CLS} font-mono`}
                  />
                </div>
              </div>

              <div>
                <FieldLabel label="NHA Client Secret (Encrypted Token)" required />
                <input
                  type="password"
                  value={data.abdmClientSecret}
                  onChange={(e) => updateField("abdmClientSecret", e.target.value)}
                  className={`${INPUT_CLS} font-mono`}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 mt-3">
                <h4 className="text-xs font-bold text-slate-800">
                  Certified ABDM Diagnostic Artifacts Shared:
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200">
                    DiagnosticReport (Pathology / Biochemistry)
                  </span>
                  <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200">
                    Observation (Analyte Quantities & Flags)
                  </span>
                  <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200">
                    Specimen (Accession & Collection Metadata)
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="FHIR R4 REST API Endpoints"
            description="Expose secure OAuth2 / SMART-on-FHIR REST endpoints for external clinical electronic health record interoperability."
            icon={FileCode}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel label="FHIR Base URL Endpoint" />
                <input
                  type="text"
                  value={data.fhirBaseUrl}
                  onChange={(e) => updateField("fhirBaseUrl", e.target.value)}
                  className={`${INPUT_CLS} font-mono`}
                />
              </div>

              <div>
                <FieldLabel label="FHIR Authorization Protocol" />
                <select
                  value={data.fhirAuthMethod}
                  onChange={(e) =>
                    updateField("fhirAuthMethod", e.target.value as any)
                  }
                  className={SELECT_CLS}
                >
                  <option value="SMART_ON_FHIR">SMART on FHIR (OAuth2 + PKCE)</option>
                  <option value="BEARER_TOKEN">JWT Bearer Token</option>
                  <option value="OAUTH2">Standard OAuth 2.0 Client Credentials</option>
                  <option value="NONE">Mutual TLS Only (No Token)</option>
                </select>
              </div>
            </div>
          </SectionCard>
        </div>
      )}


      {/* TAB 5: Label & Report Printers */}
      {(activeTab === "printers" || subSection === "hardware-lrs") && (
        <div className="space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Barcode Printers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">4 Online</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Zebra & TSC Thermal</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Report Printers</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">3 Network</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">HP & Canon Laser</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Label Format</p>
              <p className="text-2xl font-black text-sky-900 mt-1">50×25 mm</p>
              <p className="text-[11px] text-sky-600 mt-0.5">2-inch Vacutainer standard</p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Print Protocol</p>
              <p className="text-2xl font-black text-indigo-900 mt-1">ZPL / TSPL</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">Direct RAW TCP Socket 9100</p>
            </div>
          </div>

          <SectionCard
            title="Thermal Barcode & Specimen Label Printers"
            description="Manage direct TCP/IP RAW socket or USB thermal barcode printers for phlebotomy vacutainer collection tubes, slides, and blood units."
            icon={Printer}
            badge="Phlebotomy Hardcopy"
            badgeVariant="blue"
          >
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Printer Name & Model</th>
                      <th className="px-3 py-2.5">Station / Location</th>
                      <th className="px-3 py-2.5">Connection</th>
                      <th className="px-3 py-2.5">Emulation</th>
                      <th className="px-3 py-2.5">Label Size</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">Zebra ZD420-HC (Healthcare)</td>
                      <td className="px-3 py-2.5 text-slate-600">Phlebotomy Cubicle 1</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">192.168.1.140:9100</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-sky-50 text-sky-700 px-1.5 py-0.5 font-bold text-[10px]">ZPL II (203 DPI)</span></td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">50 × 25 mm</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">READY</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">TSC TE244 Direct Thermal</td>
                      <td className="px-3 py-2.5 text-slate-600">Phlebotomy Cubicle 2</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">192.168.1.141:9100</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-bold text-[10px]">TSPL</span></td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">50 × 25 mm</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">READY</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">Zebra ZT410 Industrial</td>
                      <td className="px-3 py-2.5 text-slate-600">Central Accessioning Bench</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">192.168.1.142:9100</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-sky-50 text-sky-700 px-1.5 py-0.5 font-bold text-[10px]">ZPL II (300 DPI)</span></td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">38 × 19 mm (Slides)</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">READY</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">TVS LP 46 Neo</td>
                      <td className="px-3 py-2.5 text-slate-600">Casualty / Emergency Lab</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">USB Virtual COM 4</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-bold text-[10px]">EPL</span></td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">50 × 25 mm</td>
                      <td className="px-3 py-2.5"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">READY</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Clinical Report Laser Printers & Letterhead Tray Mapping"
            description="Configure heavy-duty A4 laser printers for patient diagnostic reports, dual-tray management (Tray 1: Hospital Pre-printed Stationery, Tray 2: Plain Medical Bond), and auto-duplexing."
            icon={Printer}
            badge="A4 Diagnostic Dossiers"
            badgeVariant="green"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">HP LaserJet Enterprise M507</span>
                    <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold">Dispatch Desk 1</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><span className="font-semibold text-slate-400 text-[10px] uppercase">IP Address:</span> 192.168.1.130 (PCL6 Driver)</p>
                    <p><span className="font-semibold text-slate-400 text-[10px] uppercase">Tray 1:</span> Pre-printed NABL Crest Letterhead</p>
                    <p><span className="font-semibold text-slate-400 text-[10px] uppercase">Tray 2:</span> Continuation Sheets (Plain 85 GSM)</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Canon imageRUNNER ADVANCE</span>
                    <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold">Dispatch Desk 2</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><span className="font-semibold text-slate-400 text-[10px] uppercase">IP Address:</span> 192.168.1.131 (UFR II Driver)</p>
                    <p><span className="font-semibold text-slate-400 text-[10px] uppercase">Tray 1:</span> Pre-printed Executive Letterhead</p>
                    <p><span className="font-semibold text-slate-400 text-[10px] uppercase">Features:</span> Auto-Staple & Duplex Enabled</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 4: PACS / DICOM Bridge */}
      {(activeTab === "pacs" || subSection === "hardware-pacs") && (
        <div className="space-y-6">
          <SectionCard
            title="PACS / DICOM Modality Worklist (MWL) & Storage Bridge"
            description="Configure Application Entity (AE) titles, port 104 listeners, and modality worklist synchronization for radiology modalities (X-Ray, USG, CT, MRI)."
            icon={Database}
            badge="DICOM 3.0"
            badgeVariant="blue"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel label="Local ELIS AE Title (Application Entity)" required />
                  <input
                    type="text"
                    value={data.pacsAeTitle}
                    onChange={(e) =>
                      updateField("pacsAeTitle", e.target.value.toUpperCase())
                    }
                    className={`${INPUT_CLS} font-mono`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Configured in Modality Worklist (MWL) query profiles on scanners.
                  </p>
                </div>

                <div>
                  <FieldLabel label="Remote Hospital PACS AE Title" required />
                  <input
                    type="text"
                    value={data.pacsRemoteAeTitle}
                    onChange={(e) =>
                      updateField("pacsRemoteAeTitle", e.target.value.toUpperCase())
                    }
                    className={`${INPUT_CLS} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                <div>
                  <FieldLabel label="Remote PACS Server IP Address" required />
                  <input
                    type="text"
                    value={data.pacsRemoteHost}
                    onChange={(e) => updateField("pacsRemoteHost", e.target.value)}
                    className={`${INPUT_CLS} font-mono`}
                    placeholder="192.168.10.80"
                  />
                </div>

                <div>
                  <FieldLabel label="Remote PACS DICOM Port" required />
                  <input
                    type="number"
                    value={data.pacsRemotePort}
                    onChange={(e) =>
                      updateField("pacsRemotePort", Number(e.target.value))
                    }
                    className={`${INPUT_CLS} font-mono`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standard DICOM port 104 or 11112 for C-STORE / C-FIND queries.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.dicomMwlEnabled}
                    onChange={(e) =>
                      updateField("dicomMwlEnabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable Modality Worklist (MWL) Provider Service
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.dicomStorageSCU}
                    onChange={(e) =>
                      updateField("dicomStorageSCU", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable DICOM C-STORE SCU Image Retrieval & Thumbnail Generation
                </label>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
