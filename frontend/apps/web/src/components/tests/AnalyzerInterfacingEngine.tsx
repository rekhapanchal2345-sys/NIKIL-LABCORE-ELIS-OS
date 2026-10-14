"use client";

import React, { useState } from "react";
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Cpu,
  Layers,
  Search,
  ExternalLink,
  Wifi,
  WifiOff,
  Radio,
  FileCode,
  Terminal,
  Send,
  Zap,
  Check,
  Copy,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface InstrumentInterface {
  id: string;
  name: string;
  model: string;
  department: string;
  protocol: "ASTM_E1394" | "HL7_V2" | "RS232_SERIAL" | "TCPIP_SOCKET";
  connectionMode: "BI_DIRECTIONAL" | "UNI_DIRECTIONAL_HOST" | "DIRECT_QUERY";
  ipAddress: string;
  portNumber: number;
  baudRate?: string;
  status: "CONNECTED_ONLINE" | "STANDBY" | "TRANSMITTING" | "ERROR_OFFLINE";
  lastPing: string;
  activeWorklistCount: number;
  channelMappingsCount: number;
  supportedTube: string;
}

const DEFAULT_INTERFACES: InstrumentInterface[] = [
  {
    id: "iface-01",
    name: "Sysmex XN Automated Hematology",
    model: "Sysmex XN-550 (5-Part Diff)",
    department: "Hematology & Hemostasis",
    protocol: "ASTM_E1394",
    connectionMode: "BI_DIRECTIONAL",
    ipAddress: "192.168.1.104",
    portNumber: 5100,
    status: "CONNECTED_ONLINE",
    lastPing: "Just now (12ms)",
    activeWorklistCount: 18,
    channelMappingsCount: 24,
    supportedTube: "EDTA Purple",
  },
  {
    id: "iface-02",
    name: "Roche Cobas Integrated Clinical Chemistry",
    model: "Cobas c 311 Spectrophotometric Analyzer",
    department: "Clinical Biochemistry",
    protocol: "HL7_V2",
    connectionMode: "BI_DIRECTIONAL",
    ipAddress: "192.168.1.108",
    portNumber: 6000,
    status: "CONNECTED_ONLINE",
    lastPing: "1 min ago (16ms)",
    activeWorklistCount: 34,
    channelMappingsCount: 52,
    supportedTube: "SST Gold / Plain Red",
  },
  {
    id: "iface-03",
    name: "Abbott Architect Chemiluminescence Immunoassay",
    model: "Architect i1000SR CMIA Platform",
    department: "Endocrinology & Serology",
    protocol: "ASTM_E1394",
    connectionMode: "DIRECT_QUERY",
    ipAddress: "192.168.1.112",
    portNumber: 5200,
    status: "TRANSMITTING",
    lastPing: "Just now (8ms)",
    activeWorklistCount: 12,
    channelMappingsCount: 36,
    supportedTube: "Serum Gel / SST",
  },
  {
    id: "iface-04",
    name: "Bio-Rad D-10 HPLC Diabetes Workstation",
    model: "Bio-Rad D-10 High-Performance Liquid Chromatography",
    department: "Diabetes & Glycated Proteins",
    protocol: "RS232_SERIAL",
    connectionMode: "UNI_DIRECTIONAL_HOST",
    ipAddress: "COM Port 3",
    portNumber: 9600,
    baudRate: "9600-8-N-1",
    status: "CONNECTED_ONLINE",
    lastPing: "4 mins ago",
    activeWorklistCount: 8,
    channelMappingsCount: 4,
    supportedTube: "EDTA Whole Blood",
  },
];

interface ChannelMapping {
  testCode: string;
  testName: string;
  analyzerChannel: string;
  dilutionFactor: string;
  sampleType: string;
  autoValidate: boolean;
  analyzerModel: string;
}

const DEFAULT_MAPPINGS: ChannelMapping[] = [
  { testCode: "CBC", testName: "Complete Blood Count", analyzerChannel: "SYS_XN_DIFF_ALL", dilutionFactor: "1:1 Direct", sampleType: "Whole Blood", autoValidate: true, analyzerModel: "Sysmex XN-550" },
  { testCode: "HGB", testName: "Hemoglobin (Cyanmethemoglobin)", analyzerChannel: "SYS_HGB_SLS", dilutionFactor: "1:1 Direct", sampleType: "Whole Blood", autoValidate: true, analyzerModel: "Sysmex XN-550" },
  { testCode: "PLT", testName: "Platelet Count (Impedance)", analyzerChannel: "SYS_PLT_I", dilutionFactor: "1:1 Direct", sampleType: "Whole Blood", autoValidate: false, analyzerModel: "Sysmex XN-550" },
  { testCode: "GLUC_F", testName: "Fasting Plasma Glucose (GOD-POD)", analyzerChannel: "RCH_C311_GLUCOSE", dilutionFactor: "1:1 Direct", sampleType: "Plasma Fluoride", autoValidate: true, analyzerModel: "Cobas c 311" },
  { testCode: "CREAT", testName: "Serum Creatinine (Enzymatic IDMS)", analyzerChannel: "RCH_C311_CREA_ENZ", dilutionFactor: "1:1 Direct", sampleType: "Serum", autoValidate: true, analyzerModel: "Cobas c 311" },
  { testCode: "TSH", testName: "Thyroid Stimulating Hormone (Ultra-Sensitive)", analyzerChannel: "ABT_I1000_TSH_UL", dilutionFactor: "1:1 Direct", sampleType: "Serum", autoValidate: false, analyzerModel: "Architect i1000SR" },
  { testCode: "HBA1C", testName: "Glycated Hemoglobin (NGSP HPLC)", analyzerChannel: "BR_D10_HBA1C_A1C", dilutionFactor: "1:5 Hemolysate", sampleType: "Whole Blood", autoValidate: true, analyzerModel: "Bio-Rad D-10" },
];

export default function AnalyzerInterfacingEngine() {
  const [interfaces, setInterfaces] = useState<InstrumentInterface[]>(DEFAULT_INTERFACES);
  const [selectedInterface, setSelectedInterface] = useState<InstrumentInterface>(DEFAULT_INTERFACES[0]);
  const [mappings, setMappings] = useState<ChannelMapping[]>(DEFAULT_MAPPINGS);
  const [mappingSearch, setMappingSearch] = useState("");
  
  // Simulator State
  const [simBarcode, setSimBarcode] = useState("BAR-2026-90412");
  const [simulating, setSimulating] = useState(false);
  const [simLog, setSimLog] = useState<{
    status: "IDLE" | "SUCCESS" | "RUNNING";
    rawFrame?: string;
    parsedResults?: Array<{ analyte: string; value: string; unit: string; flag: string }>;
  }>({ status: "IDLE" });

  const handleSimulateWorklistQuery = () => {
    setSimulating(true);
    setSimLog({ status: "RUNNING" });

    setTimeout(() => {
      setSimulating(false);
      setSimLog({
        status: "SUCCESS",
        rawFrame: `H|\\^&|||${selectedInterface.name}^${selectedInterface.model}|||||||P|E1394-97|20261009121500\n` +
          `P|1||UHID-2026-9041||Deshmukh^Aarav||19910815|M|||||Dr. Sandeep Deshmukh\n` +
          `O|1|${simBarcode}||^^^${selectedInterface.id === "iface-01" ? "SYS_XN_DIFF_ALL" : "RCH_C311_GLUCOSE"}|R|20261009121000|||||A\n` +
          `R|1|^^^HGB|14.2|g/dL||N||F||||20261009121422\n` +
          `R|2|^^^WBC|7.4|10^3/uL||N||F||||20261009121422\n` +
          `R|3|^^^PLT|220|10^3/uL||N||F||||20261009121422\n` +
          `L|1|N`,
        parsedResults: [
          { analyte: "Hemoglobin (HGB)", value: "14.2", unit: "g/dL", flag: "NORMAL" },
          { analyte: "Total Leukocyte Count (WBC)", value: "7.4", unit: "10³/µL", flag: "NORMAL" },
          { analyte: "Platelet Count (PLT)", value: "220", unit: "10³/µL", flag: "NORMAL" },
        ],
      });
    }, 700);
  };

  const filteredMappings = mappings.filter((m) => {
    if (mappingSearch) {
      const q = mappingSearch.toLowerCase();
      return (
        m.testName.toLowerCase().includes(q) ||
        m.testCode.toLowerCase().includes(q) ||
        m.analyzerChannel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Light White Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                LIMS Interfacing Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ASTM &amp; HL7 Engine Active
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              Bi-directional Laboratory Analyzer Interfacing &amp; Port Mapping Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated two-way communication between hospital diagnostic analyzers (Sysmex, Cobas, Mindray, Abbott) and LabCore ELIS. Eliminates manual result transcription errors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Connected Instruments:</span>
            <span className="text-sm font-black text-slate-900 font-mono bg-slate-100 px-2.5 py-1 rounded-xl">
              {interfaces.filter((i) => i.status !== "ERROR_OFFLINE").length} / {interfaces.length} Online
            </span>
          </div>
        </div>

        {/* Instruments Card Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {interfaces.map((inst) => {
            const isSelected = selectedInterface.id === inst.id;
            return (
              <div
                key={inst.id}
                onClick={() => setSelectedInterface(inst)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/50 border-blue-400 shadow-xs ring-2 ring-blue-500/10"
                    : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">{inst.protocol.replace(/_/g, " ")}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      inst.status === "CONNECTED_ONLINE"
                        ? "bg-emerald-100 text-emerald-800"
                        : inst.status === "TRANSMITTING"
                        ? "bg-blue-100 text-blue-800 animate-pulse"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    ● {inst.status.replace(/_/g, " ")}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{inst.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium truncate">{inst.model}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px]">{inst.ipAddress}:{inst.portNumber}</span>
                  <span className="font-bold text-blue-700">{inst.channelMappingsCount} Tests Mapped</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column: Channel Mappings & Protocol Packet Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Test Channel Mapping Directory */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Active Channel Mappings ({selectedInterface.model})
              </h3>
              <p className="text-[11px] text-slate-500">Maps clinical investigation codes to instrument channel numbers</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search mapped test code..."
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Test Code &amp; Name</th>
                  <th className="p-3">Analyzer Channel ID</th>
                  <th className="p-3">Dilution &amp; Sample</th>
                  <th className="p-3 text-right">Auto-Approve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMappings.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{m.testName}</div>
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        {m.testCode}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {m.analyzerChannel}
                    </td>
                    <td className="p-3 text-[11px] text-slate-600">
                      <div>{m.sampleType}</div>
                      <div className="text-[10px] text-slate-400">{m.dilutionFactor}</div>
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.autoValidate
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.autoValidate ? "✓ Auto-Approve" : "Manual Review"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Bi-directional Frame Dispatch Simulator */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-800" />
              Bi-directional Frame Dispatch Simulator
            </h3>
            <p className="text-[11px] text-slate-500">
              Test worklist queries and raw ASTM/HL7 packet generation for {selectedInterface.name}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sample Tube Barcode Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simBarcode}
                  onChange={(e) => setSimBarcode(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSimulateWorklistQuery}
                  disabled={simulating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Play className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
                  <span>Send Query</span>
                </button>
              </div>
            </div>

            {simLog.status === "SUCCESS" && (
              <div className="space-y-3 animate-in fade-in-50 duration-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Raw ASTM E1394-97 Data Stream:
                  </span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto leading-relaxed max-h-40">
                    {simLog.rawFrame}
                  </pre>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-Mapped Results to LIS Result Entry:
                  </span>
                  <div className="space-y-1.5">
                    {simLog.parsedResults?.map((res, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/70">
                        <span className="font-semibold text-slate-800">{res.analyte}</span>
                        <span className="font-mono font-bold text-slate-900">{res.value} {res.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
