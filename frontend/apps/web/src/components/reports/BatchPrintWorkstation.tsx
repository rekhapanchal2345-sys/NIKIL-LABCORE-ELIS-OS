// File: frontend/apps/web/src/components/reports/BatchPrintWorkstation.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Printer,
  CheckSquare,
  Square,
  FileText,
  Layers,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Download,
  Sparkles,
} from 'lucide-react';

export interface DispatchPrintableReportItem {
  id: string;
  reportNumber: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  uhid: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  department: string;
  status: 'GENERATED' | 'PUBLISHED' | 'DRAFT';
  isAmended?: boolean;
  version?: string;
  generatedAt?: string;
  shortChecksum?: string;
}

export interface BatchPrintWorkstationProps {
  reports: DispatchPrintableReportItem[];
  onPreviewReport?: (item: DispatchPrintableReportItem) => void;
  onRefreshQueue?: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const BatchPrintWorkstation: React.FC<BatchPrintWorkstationProps> = ({
  reports,
  onPreviewReport,
  onRefreshQueue,
}) => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Print Station Configuration
  const [printerProfile, setPrinterProfile] = useState<string>('DISPATCH_LASER_A4_MAIN');
  const [includeLetterhead, setIncludeLetterhead] = useState<boolean>(true);
  const [duplex, setDuplex] = useState<boolean>(false);
  const [copies, setCopies] = useState<number>(1);
  const [collate, setCollate] = useState<boolean>(true);

  // Spooling Progress State
  const [spooling, setSpooling] = useState<boolean>(false);
  const [spoolProgress, setSpoolProgress] = useState<number>(0);
  const [spoolStatusText, setSpoolStatusText] = useState<string>('');
  const [lastBatchResult, setLastBatchResult] = useState<{
    batchJobId: string;
    readyCount: number;
    totalRequested: number;
    items: Array<{
      orderId: string;
      orderNumber: string;
      reportNumber: string;
      patientName: string;
      pdfStreamUrl: string;
      shortChecksum: string;
    }>;
  } | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.reportNumber.toLowerCase().includes(q) ||
          item.orderNumber.toLowerCase().includes(q) ||
          item.patientName.toLowerCase().includes(q) ||
          item.uhid.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, priorityFilter, searchQuery]);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allIds = filteredReports.map((r) => r.orderId);
    const allSelected = allIds.every((id) => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...allIds])));
    }
  };

  const handleSelectStatOnly = () => {
    const statIds = filteredReports.filter((r) => r.priority === 'STAT').map((r) => r.orderId);
    setSelectedOrderIds(statIds);
  };

  const handleExecuteBatchSpool = async () => {
    if (selectedOrderIds.length === 0) return;

    setSpooling(true);
    setSpoolProgress(15);
    setSpoolStatusText(`Initializing NABL A4 Print Spooler for ${selectedOrderIds.length} report(s)...`);
    setLastBatchResult(null);

    try {
      setSpoolProgress(45);
      const response = await fetch(`${API_BASE_URL}/api/reports/batch-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          includeLetterhead,
          paperSize: 'A4',
          duplex,
          copies,
          collate,
          printerProfile,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Batch print spooling failed.');
      }

      setSpoolProgress(85);
      setSpoolStatusText('Verifying SHA-256 PDF checksums & preparing browser print frames...');

      const manifest = json.data;
      setLastBatchResult({
        batchJobId: manifest.batchJobId,
        readyCount: manifest.summary.readyCount,
        totalRequested: manifest.summary.totalRequested,
        items: manifest.items.filter((i: any) => i.status === 'READY'),
      });

      setSpoolProgress(100);
      setSpoolStatusText(
        `Spooled ${manifest.summary.readyCount} certified report(s) under Job ${manifest.batchJobId}`
      );

      // Open the first ready PDF in a print-ready tab if single or trigger sequential print window
      const readyItems = manifest.items.filter((i: any) => i.status === 'READY');
      if (readyItems.length === 1) {
        window.open(`${API_BASE_URL}${readyItems[0].pdfStreamUrl}`, '_blank');
      }
    } catch (err: any) {
      setSpoolStatusText(`Error: ${err?.message || 'Unable to spool batch print job'}`);
    } finally {
      setTimeout(() => setSpooling(false), 600);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 8 Columns: Dispatch-Ready Report Queue Table */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        {/* Queue Header & Quick Filters */}
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-400" />
                Laboratory Dispatch &amp; High-Throughput Batch Print Queue
              </h2>
              <p className="text-xs text-slate-400">
                Select multiple verified NABL reports to spool sequentially to A4 laser stationery
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectStatOnly}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
              >
                Select All STAT
              </button>
              {onRefreshQueue && (
                <button
                  type="button"
                  onClick={onRefreshQueue}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Refresh Dispatch Queue"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Order #, Report #, Patient Name, or UHID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['ALL', 'STAT', 'URGENT', 'ROUTINE'] as const).map((prio) => (
                <button
                  key={prio}
                  type="button"
                  onClick={() => setPriorityFilter(prio)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    priorityFilter === prio
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {prio}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Select Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 pl-5 pr-2 w-10">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-slate-400 hover:text-teal-400"
                  >
                    {filteredReports.length > 0 &&
                    filteredReports.every((r) => selectedOrderIds.includes(r.orderId)) ? (
                      <CheckSquare className="w-4 h-4 text-teal-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Report / Order #</th>
                <th className="py-3 px-3">Patient &amp; UHID</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Version &amp; Checksum</th>
                <th className="py-3 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No dispatch-ready diagnostic reports match the current filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => {
                  const isSelected = selectedOrderIds.includes(item.orderId);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => toggleOrderSelection(item.orderId)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-teal-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleOrderSelection(item.orderId)}
                          className="text-slate-400 hover:text-teal-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-white block">
                          {item.reportNumber}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          Order: {item.orderNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-100 block">
                          {item.patientName}
                        </span>
                        <span className="font-mono text-[11px] text-teal-400">{item.uhid}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.priority === 'STAT'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : item.priority === 'URGENT'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              item.isAmended
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {item.version || 'v1.0'}
                          </span>
                          {item.shortChecksum && (
                            <span className="font-mono text-[10px] text-slate-400">
                              {item.shortChecksum.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="py-3.5 pl-3 pr-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {onPreviewReport && (
                            <button
                              type="button"
                              onClick={() => onPreviewReport(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                              title="Preview Certified PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <a
                            href={`${API_BASE_URL}/api/reports/order/${item.orderId}/file?download=1`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400"
                            title="Direct PDF Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right 4 Columns: Print Configuration & Spooler Control Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
            <Settings2 className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Stationery &amp; Printer Setup</h3>
              <p className="text-xs text-slate-400">NABL A4 Portrait Dispatch Calibration</p>
            </div>
          </div>

          {/* Target Printer Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Station Printer
            </label>
            <select
              value={printerProfile}
              onChange={(e) => setPrinterProfile(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="DISPATCH_LASER_A4_MAIN">
                Dispatch Desk 01 — HP LaserJet Enterprise M611 (A4)
              </option>
              <option value="ICU_STAT_PRINTER">
                ICU / Emergency STAT Network Printer (Tray 1)
              </option>
              <option value="OPD_COLLECTION_DESK">
                OPD Report Handover Counter Printer
              </option>
              <option value="SYSTEM_DEFAULT_PDF">System Default Printer / PDF Spooler</option>
            </select>
          </div>

          {/* Stationery Mode: Blank A4 vs Pre-Printed Lab Letterhead */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              A4 Stationery Mode
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setIncludeLetterhead(true)}
                className={`p-3 rounded-xl border text-left transition ${
                  includeLetterhead
                    ? 'bg-teal-500/15 border-teal-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Standard Blank A4 Paper</span>
                  {includeLetterhead && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Prints full vector NABL MC-6184 letterhead, accreditation seal &amp; footer
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIncludeLetterhead(false)}
                className={`p-3 rounded-xl border text-left transition ${
                  !includeLetterhead
                    ? 'bg-teal-500/15 border-teal-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Pre-Printed Lab Letterhead Stationery</span>
                  {!includeLetterhead && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Omits top 45mm header graphic to align cleanly with pre-printed hospital paper
                </p>
              </button>
            </div>
          </div>

          {/* Duplex & Copies */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Duplex Mode
              </label>
              <select
                value={duplex ? 'DUPLEX' : 'SIMPLEX'}
                onChange={(e) => setDuplex(e.target.value === 'DUPLEX')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="SIMPLEX">Single-Sided</option>
                <option value="DUPLEX">Double-Sided (Duplex)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Copies / Report
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          {/* Collate Toggle */}
          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-1">
            <span>Collate Multi-Page Reports Automatically</span>
            <input
              type="checkbox"
              checked={collate}
              onChange={(e) => setCollate(e.target.checked)}
              className="rounded border-slate-700 text-teal-500 focus:ring-teal-500"
            />
          </label>

          {/* Primary Batch Spool & Print Trigger */}
          <button
            type="button"
            disabled={selectedOrderIds.length === 0 || spooling}
            onClick={handleExecuteBatchSpool}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition"
          >
            <Printer className="w-4 h-4" />
            {spooling
              ? 'Spooling Print Job...'
              : `Spool & Print Selected (${selectedOrderIds.length} Report${
                  selectedOrderIds.length === 1 ? '' : 's'
                })`}
          </button>

          {/* Real-Time Progress Bar */}
          {(spooling || spoolStatusText) && (
            <div className="space-y-2 pt-2">
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${spoolProgress}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-teal-300">{spoolStatusText}</p>
            </div>
          )}
        </div>

        {/* Spooled Manifest Output Card */}
        {lastBatchResult && (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                Batch Spool Ready ({lastBatchResult.readyCount}/{lastBatchResult.totalRequested})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {lastBatchResult.batchJobId}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {lastBatchResult.items.map((item) => (
                <div
                  key={item.orderId}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-white block">
                      {item.reportNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.patientName}</span>
                  </div>
                  <a
                    href={`${API_BASE_URL}${item.pdfStreamUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-[11px] font-semibold"
                  >
                    <FileText className="w-3 h-3" />
                    Open PDF
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchPrintWorkstation;
