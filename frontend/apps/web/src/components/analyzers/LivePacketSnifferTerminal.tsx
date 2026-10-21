'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Terminal,
  Play,
  Pause,
  Download,
  Send,
  Trash2,
  Filter,
  Cpu,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownLeft,
  Code2,
} from 'lucide-react';

// ============================================================================
// TELEMETRY PACKET TYPES
// ============================================================================
export type PacketSyntaxColor = 'VALID_GREEN' | 'ERROR_RED' | 'OUTBOUND_BLUE';

export interface SnifferPacketFrame {
  id: string;
  timestamp: string;
  analyzerId: string;
  analyzerName: string;
  protocol: 'ASTM_E1381' | 'HL7_MLLP';
  direction: 'RX_INBOUND' | 'TX_OUTBOUND';
  syntaxColor: PacketSyntaxColor;
  rawAscii: string;
  rawHex: string;
  expectedChecksum: string;
  calculatedChecksum: string;
  decodedRecordSummary: string;
  byteLength: number;
}

// ============================================================================
// HELPER: COMPUTE ASTM E1381 MODULO 256 CHECKSUM & HEX DUMP IN BROWSER
// ============================================================================
function calculateBrowserAstmChecksum(asciiBodyWithControlTokens: string): {
  checksumHex: string;
  rawBytes: number[];
  formattedHex: string;
} {
  // Replace symbolic tokens like <STX>, <ETX>, <ETB>, <CR>, <LF>, <ENQ>, <ACK>, <NAK>, <EOT>
  const tokenMap: Record<string, number> = {
    '<STX>': 0x02,
    '<ETX>': 0x03,
    '<EOT>': 0x04,
    '<ENQ>': 0x05,
    '<ACK>': 0x06,
    '<LF>': 0x0a,
    '<VT>': 0x0b,
    '<CR>': 0x0d,
    '<NAK>': 0x15,
    '<ETB>': 0x17,
    '<FS>': 0x1c,
  };

  const bytes: number[] = [];
  let idx = 0;

  while (idx < asciiBodyWithControlTokens.length) {
    let matchedToken = false;
    for (const [token, byteVal] of Object.entries(tokenMap)) {
      if (asciiBodyWithControlTokens.startsWith(token, idx)) {
        bytes.push(byteVal);
        idx += token.length;
        matchedToken = true;
        break;
      }
    }
    if (!matchedToken) {
      bytes.push(asciiBodyWithControlTokens.charCodeAt(idx) & 0xff);
      idx++;
    }
  }

  let sum = 0;
  let counting = false;
  for (const b of bytes) {
    if (b === 0x02) {
      counting = true;
      continue;
    }
    if (counting) {
      sum = (sum + b) & 0xff;
      if (b === 0x03 || b === 0x17) {
        break;
      }
    }
  }

  const checksumHex = sum.toString(16).toUpperCase().padStart(2, '0');
  const formattedHex = bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

  return { checksumHex, rawBytes: bytes, formattedHex };
}

// ============================================================================
// PRESET HARDWARE DIAGNOSTIC FRAMES FOR TEST BENCH INJECTION
// ============================================================================
const PRESET_INJECTION_FRAMES = [
  {
    label: 'ASTM E1394 Result Frame (Potassium Panic 6.8 mmol/L)',
    analyzerId: 'COBAS-PRO-01',
    protocol: 'ASTM_E1381' as const,
    syntaxColor: 'VALID_GREEN' as const,
    direction: 'RX_INBOUND' as const,
    template: '<STX>3R|1|^^^K^Potassium^1|6.8|mmol/L|3.5-5.1|HH||F|||20261020234500|COBAS-PRO<CR><ETX>',
    summary: 'ASTM R-Record: K+ = 6.8 mmol/L [HH Panic High] (Final)',
  },
  {
    label: 'ASTM Host Query (Q) Barcode Scan #SMP-1092',
    analyzerId: 'COBAS-PRO-01',
    protocol: 'ASTM_E1381' as const,
    syntaxColor: 'OUTBOUND_BLUE' as const,
    direction: 'TX_OUTBOUND' as const,
    template: '<STX>2O|1|SMP-1092|SMP-1092^RACK-A^04|^^^NA^1\\^^^K^1\\^^^CREA^1|S|20261020234510|||||A||||SERUM<CR><ETX>',
    summary: 'Host Query Response (O-Record): Barcode #SMP-1092 -> Rack A Pos 04 (STAT)',
  },
  {
    label: 'Corrupted Parity / Checksum Mismatch Frame (Triggers <NAK>)',
    analyzerId: 'ARCHITECT-I2000',
    protocol: 'ASTM_E1381' as const,
    syntaxColor: 'ERROR_RED' as const,
    direction: 'RX_INBOUND' as const,
    template: '<STX>4R|2|^^^TSH|8.42|mIU/L|0.45-4.50|H||F<CR><ETX>',
    forceCorruptChecksum: 'FF',
    summary: 'UART Parity Drop / Checksum Error: Expected Modulo-256 CS mismatch -> Tx <NAK>',
  },
  {
    label: 'CLSI EP07-A2 Hemolysis Interference Comment (H-Index = 220 mg/dL)',
    analyzerId: 'COBAS-PRO-01',
    protocol: 'ASTM_E1381' as const,
    syntaxColor: 'ERROR_RED' as const,
    direction: 'RX_INBOUND' as const,
    template: '<STX>5C|1|I|SERUM_INDEX^H:220^I:1.1^L:30|G<CR><ETX>',
    summary: 'Pre-Analytical Interference: H-Index 220 mg/dL (>150 limit) -> SAMPLE_HEMOLYZED_RECOLLECT',
  },
  {
    label: 'HL7 v2.5.1 MLLP ORU^R01 Observation Frame (Sysmex XN-1000)',
    analyzerId: 'SYSMEX-XN-01',
    protocol: 'HL7_MLLP' as const,
    syntaxColor: 'VALID_GREEN' as const,
    direction: 'RX_INBOUND' as const,
    template: '<VT>MSH|^~\\&|SYSMEX_XN|LAB|LABCORE_ELIS|HOSP|20261020234600||ORU^R01|MSG99201|P|2.5.1<CR>PID|1||MRN-2026-8841||IYER^RAJESHWARI||19620410|F<CR>OBR|1|SMP-1092||CBC^DIFF<CR>OBX|1|NM|HGB^Hemoglobin||11.8|g/dL|12.0-15.5|L|||F<CR><FS><CR>',
    summary: 'HL7 v2.5.1 ORU^R01: PID=IYER^RAJESHWARI, OBX HGB=11.8 g/dL (Low Flag)',
  },
];

export const LivePacketSnifferTerminal: React.FC = () => {
  const [packets, setPackets] = useState<SnifferPacketFrame[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [analyzerFilter, setAnalyzerFilter] = useState<string>('ALL');
  const [colorFilter, setColorFilter] = useState<'ALL' | PacketSyntaxColor>('ALL');
  const [selectedPacket, setSelectedPacket] = useState<SnifferPacketFrame | null>(null);

  // Manual Frame Injector State
  const [customAnalyzerId, setCustomAnalyzerId] = useState<string>('COBAS-PRO-01');
  const [customRawAscii, setCustomRawAscii] = useState<string>(
    '<STX>1H|\\^&|||CobasPro^1|||||Host||P|1|20261020234500<CR><ETX>'
  );
  const [simulateChecksumCorruption, setSimulateChecksumCorruption] = useState<boolean>(false);

  // Virtualized Scroll Container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const ROW_HEIGHT = 64;
  const VIEWPORT_HEIGHT = 440;

  // Build a packet object from template
  const createPacketFromTemplate = useCallback(
    (preset: (typeof PRESET_INJECTION_FRAMES)[number]): SnifferPacketFrame => {
      const { checksumHex, formattedHex, rawBytes } = calculateBrowserAstmChecksum(preset.template);
      const actualChecksum = preset.forceCorruptChecksum || checksumHex;
      const fullAscii =
        preset.protocol === 'ASTM_E1381'
          ? `${preset.template}${actualChecksum}<CR><LF>`
          : preset.template;

      return {
        id: `PKT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString().slice(11, 23),
        analyzerId: preset.analyzerId,
        analyzerName:
          preset.analyzerId === 'COBAS-PRO-01'
            ? 'Roche Cobas Pro c503'
            : preset.analyzerId === 'SYSMEX-XN-01'
            ? 'Sysmex XN-1000'
            : 'Abbott Architect i2000SR',
        protocol: preset.protocol,
        direction: preset.direction,
        syntaxColor: preset.syntaxColor,
        rawAscii: fullAscii,
        rawHex: formattedHex,
        expectedChecksum: checksumHex,
        calculatedChecksum: actualChecksum,
        decodedRecordSummary: preset.summary,
        byteLength: rawBytes.length + 4,
      };
    },
    []
  );

  // Seed initial packets and run live stream simulation when not paused
  useEffect(() => {
    const initial = PRESET_INJECTION_FRAMES.map((p) => createPacketFromTemplate(p));
    setPackets(initial);
    if (initial.length > 0) {
      setSelectedPacket(initial[0]);
    }
  }, [createPacketFromTemplate]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const randomPreset =
        PRESET_INJECTION_FRAMES[Math.floor(Math.random() * PRESET_INJECTION_FRAMES.length)];
      const newPkt = createPacketFromTemplate(randomPreset);

      setPackets((prev) => {
        const next = [...prev, newPkt];
        return next.length > 500 ? next.slice(next.length - 500) : next;
      });

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isPaused, createPacketFromTemplate]);

  // Filtered Packets
  const filteredPackets = useMemo(() => {
    return packets.filter((pkt) => {
      const matchesAnalyzer = analyzerFilter === 'ALL' || pkt.analyzerId === analyzerFilter;
      const matchesColor = colorFilter === 'ALL' || pkt.syntaxColor === colorFilter;
      return matchesAnalyzer && matchesColor;
    });
  }, [packets, analyzerFilter, colorFilter]);

  // Virtual DOM Window Calculations
  const totalContentHeight = filteredPackets.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 4);
  const endIndex = Math.min(
    filteredPackets.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + 4
  );
  const visiblePackets = filteredPackets.slice(startIndex, endIndex);

  // Manual Frame Injection Handler
  const handleManualInject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRawAscii.trim()) return;

    const { checksumHex, formattedHex, rawBytes } = calculateBrowserAstmChecksum(customRawAscii);
    const transmittedChecksum = simulateChecksumCorruption ? 'BAD' : checksumHex;
    const isOutboundQuery = customRawAscii.includes('O|') || customRawAscii.includes('Q|');
    const syntaxColor: PacketSyntaxColor = simulateChecksumCorruption
      ? 'ERROR_RED'
      : isOutboundQuery
      ? 'OUTBOUND_BLUE'
      : 'VALID_GREEN';

    const injectedPacket: SnifferPacketFrame = {
      id: `INJ-${Date.now()}`,
      timestamp: new Date().toISOString().slice(11, 23),
      analyzerId: customAnalyzerId,
      analyzerName:
        customAnalyzerId === 'COBAS-PRO-01'
          ? 'Roche Cobas Pro c503'
          : customAnalyzerId === 'SYSMEX-XN-01'
          ? 'Sysmex XN-1000'
          : 'Abbott Architect i2000SR',
      protocol: customRawAscii.startsWith('<VT>') ? 'HL7_MLLP' : 'ASTM_E1381',
      direction: isOutboundQuery ? 'TX_OUTBOUND' : 'RX_INBOUND',
      syntaxColor,
      rawAscii: `${customRawAscii}${transmittedChecksum}<CR><LF>`,
      rawHex: formattedHex,
      expectedChecksum: checksumHex,
      calculatedChecksum: transmittedChecksum,
      decodedRecordSummary: simulateChecksumCorruption
        ? `Manual Injection (Corrupted CS=${transmittedChecksum} vs Expected=${checksumHex}) -> Triggers <NAK>`
        : `Manual Hardware Test Frame Injected (${rawBytes.length} bytes, CS=${checksumHex} Valid)`,
      byteLength: rawBytes.length + 4,
    };

    setPackets((prev) => [...prev, injectedPacket]);
    setSelectedPacket(injectedPacket);
  };

  // Export PCAP / Diagnostic Log Bundle
  const handleExportLogBundle = () => {
    const logLines = filteredPackets.map(
      (p) =>
        `[${p.timestamp}] [${p.analyzerId}] [${p.protocol}] [${p.direction}] [${p.syntaxColor}] CS=${p.calculatedChecksum}/${p.expectedChecksum}\n  ASCII: ${p.rawAscii}\n  HEX  : ${p.rawHex}\n  INFO : ${p.decodedRecordSummary}\n`
    );
    const blob = new Blob([logLines.join('\n----------------------------------------\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nikil-labcore-packet-capture-${new Date().toISOString().slice(0, 19)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* =================================================================== */}
      {/* TERMINAL HEADER & STREAM CONTROLS                                   */}
      {/* =================================================================== */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>RS-232 / ASTM E1381 & HL7 MLLP Live Hardware Packet Sniffer</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono rounded-full ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                }`}
              >
                {isPaused ? 'STREAM PAUSED' : 'LIVE CAPTURE'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time Hex/ASCII frame decoder, Modulo-256 checksum verifier & hardware frame injector
            </p>
          </div>
        </div>

        {/* Filter & Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Filter by Analyzer */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={analyzerFilter}
              onChange={(e) => setAnalyzerFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Analyzers ({packets.length})</option>
              <option value="COBAS-PRO-01" className="bg-slate-900">Roche Cobas Pro c503 (COM3)</option>
              <option value="SYSMEX-XN-01" className="bg-slate-900">Sysmex XN-1000 (MLLP:6002)</option>
              <option value="ARCHITECT-I2000" className="bg-slate-900">Abbott Architect i2000SR (COM4)</option>
            </select>
          </div>

          {/* Filter by Syntax Color */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value as 'ALL' | PacketSyntaxColor)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Frame Types</option>
              <option value="VALID_GREEN" className="bg-slate-900">Green: Valid Checksum Frames</option>
              <option value="ERROR_RED" className="bg-slate-900">Red: Frame Errors / NAK / HIL</option>
              <option value="OUTBOUND_BLUE" className="bg-slate-900">Blue: Outbound Host Queries</option>
            </select>
          </div>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>

          {/* Export PCAP/Log */}
          <button
            type="button"
            onClick={handleExportLogBundle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export .pcap/.log</span>
          </button>

          {/* Clear Buffer */}
          <button
            type="button"
            onClick={() => {
              setPackets([]);
              setSelectedPacket(null);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700"
            title="Clear Ring Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN SPLIT VIEW: VIRTUALIZED PACKET STREAM + HEX/ASCII INSPECTOR     */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left 7 Columns: Virtualized Packet Stream */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            ref={scrollContainerRef}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            style={{ height: `${VIEWPORT_HEIGHT}px` }}
            className="overflow-y-auto relative font-mono text-xs bg-slate-950"
          >
            <div style={{ height: `${totalContentHeight}px`, position: 'relative' }}>
              {visiblePackets.map((pkt, idx) => {
                const actualIndex = startIndex + idx;
                const topOffset = actualIndex * ROW_HEIGHT;
                const isSelected = selectedPacket?.id === pkt.id;

                const rowColorClasses =
                  pkt.syntaxColor === 'VALID_GREEN'
                    ? 'border-l-4 border-l-emerald-500 text-emerald-300 bg-emerald-950/15 hover:bg-emerald-950/30'
                    : pkt.syntaxColor === 'ERROR_RED'
                    ? 'border-l-4 border-l-rose-500 text-rose-300 bg-rose-950/25 hover:bg-rose-950/40'
                    : 'border-l-4 border-l-sky-500 text-sky-300 bg-sky-950/20 hover:bg-sky-950/35';

                return (
                  <div
                    key={pkt.id}
                    onClick={() => setSelectedPacket(pkt)}
                    style={{
                      position: 'absolute',
                      top: `${topOffset}px`,
                      left: 0,
                      right: 0,
                      height: `${ROW_HEIGHT}px`,
                    }}
                    className={`px-3 py-2 border-b border-slate-900 cursor-pointer flex flex-col justify-between transition-colors ${rowColorClasses} ${
                      isSelected ? 'ring-1 ring-inset ring-white/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {pkt.direction === 'RX_INBOUND' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="text-[11px] text-slate-400">{pkt.timestamp}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 text-[10px] font-bold text-slate-200 border border-slate-700">
                          {pkt.analyzerId}
                        </span>
                        <span className="truncate font-semibold">{pkt.rawAscii}</span>
                      </div>

                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 shrink-0">
                        CS:{pkt.calculatedChecksum}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate pl-5">
                      {pkt.decodedRecordSummary}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Side-by-Side Hex/ASCII Frame Inspector */}
        <div className="lg:col-span-5 bg-slate-900/60 p-4 flex flex-col justify-between space-y-4">
          {selectedPacket ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Frame Inspector • {selectedPacket.protocol}
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    {selectedPacket.analyzerName} ({selectedPacket.analyzerId})
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                    selectedPacket.syntaxColor === 'VALID_GREEN'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : selectedPacket.syntaxColor === 'ERROR_RED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}
                >
                  {selectedPacket.syntaxColor === 'VALID_GREEN' && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {selectedPacket.syntaxColor === 'ERROR_RED' && (
                    <AlertOctagon className="w-3.5 h-3.5" />
                  )}
                  {selectedPacket.syntaxColor === 'OUTBOUND_BLUE' && (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {selectedPacket.syntaxColor === 'VALID_GREEN'
                      ? 'CHECKSUM VALID'
                      : selectedPacket.syntaxColor === 'ERROR_RED'
                      ? 'FRAME / HIL ERROR'
                      : 'HOST QUERY TX'}
                  </span>
                </span>
              </div>

              {/* ASCII Representation */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1 flex justify-between">
                  <span>RAW ASCII CONTROL STREAM</span>
                  <span>{selectedPacket.byteLength} Bytes</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 break-all">
                  {selectedPacket.rawAscii}
                </div>
              </div>

              {/* Hexadecimal Representation */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1 flex justify-between">
                  <span>RAW HEXADECIMAL DUMP</span>
                  <span>
                    Expected CS: {selectedPacket.expectedChecksum} | Rx CS:{' '}
                    {selectedPacket.calculatedChecksum}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 break-all leading-relaxed">
                  {selectedPacket.rawHex}
                </div>
              </div>

              {/* Decoded Clinical Meaning */}
              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">
                  DECODED CLINICAL INTERPRETATION
                </div>
                <p className="text-xs text-slate-200">{selectedPacket.decodedRecordSummary}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Select any frame in the sniffer stream to inspect raw Hex/ASCII bytes.
            </div>
          )}

          {/* =============================================================== */}
          {/* MANUAL HARDWARE PACKET INJECTOR TEST BENCH                      */}
          {/* =============================================================== */}
          <form
            onSubmit={handleManualInject}
            className="pt-3 border-t border-slate-800 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                <span>Manual Hardware Packet Injector (Test Bench)</span>
              </span>
              <div className="flex items-center gap-1">
                {PRESET_INJECTION_FRAMES.slice(0, 3).map((preset, i) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCustomAnalyzerId(preset.analyzerId);
                      setCustomRawAscii(preset.template);
                      setSimulateChecksumCorruption(Boolean(preset.forceCorruptChecksum));
                    }}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    Preset #{i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={customAnalyzerId}
                onChange={(e) => setCustomAnalyzerId(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200"
              >
                <option value="COBAS-PRO-01">COBAS-PRO-01 (ASTM)</option>
                <option value="SYSMEX-XN-01">SYSMEX-XN-01 (HL7)</option>
                <option value="ARCHITECT-I2000">ARCHITECT-I2000 (ASTM)</option>
              </select>

              <label className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateChecksumCorruption}
                  onChange={(e) => setSimulateChecksumCorruption(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <span>Simulate Parity Drop / Bad Checksum (Test &lt;NAK&gt;)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customRawAscii}
                onChange={(e) => setCustomRawAscii(e.target.value)}
                placeholder="<STX>1R|1|^^^K|5.9|mmol/L||H||F<CR><ETX>"
                className="flex-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Inject Frame</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LivePacketSnifferTerminal;
