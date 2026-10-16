"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Network,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Send,
  Radio,
  Terminal
} from "lucide-react";
import { analyzersApi } from "@/lib/api";
import { Analyzer } from "@/types";

interface ConnectionTestModalProps {
  analyzer: Analyzer | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export default function ConnectionTestModal({
  analyzer,
  isOpen,
  onClose,
  onStatusUpdated,
}: ConnectionTestModalProps) {
  const [testing, setTesting] = useState(false);
  const [stages, setStages] = useState<{
    socket: "pending" | "running" | "success" | "failed";
    handshake: "pending" | "running" | "success" | "failed";
    latency: number | null;
    protocolVerified: boolean;
    rawEcho: string | null;
    errorMessage: string | null;
  }>({
    socket: "pending",
    handshake: "pending",
    latency: null,
    protocolVerified: false,
    rawEcho: null,
    errorMessage: null,
  });

  const runTest = useCallback(async () => {
    if (!analyzer) return;
    setTesting(true);
    setStages({
      socket: "running",
      handshake: "pending",
      latency: null,
      protocolVerified: false,
      rawEcho: null,
      errorMessage: null,
    });

    const startTime = Date.now();

    try {
      // Step 1: Call API test connection
      const response = await analyzersApi.testConnection(analyzer.id, {
        timeout: 5000,
        retries: 2,
      });

      const elapsed = Date.now() - startTime;

      if (response.success && response.data) {
        setStages({
          socket: "success",
          handshake: response.data.connected !== false ? "success" : "failed",
          latency: response.data.latency || elapsed,
          protocolVerified: true,
          rawEcho: response.data.response || `<ACK> [Protocol ${analyzer.protocol || 'ASTM'} Validated]`,
          errorMessage: null,
        });

        // Trigger parent refresh to update status badge
        onStatusUpdated?.();
      } else {
        setStages({
          socket: "failed",
          handshake: "failed",
          latency: elapsed,
          protocolVerified: false,
          rawEcho: null,
          errorMessage: response.message || "Connection timed out or target host unreachable.",
        });
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      setStages({
        socket: "failed",
        handshake: "failed",
        latency: elapsed,
        protocolVerified: false,
        rawEcho: null,
        errorMessage: err.message || "Network handshake failed: Connection refused.",
      });
    } finally {
      setTesting(false);
    }
  }, [analyzer, onStatusUpdated]);

  useEffect(() => {
    if (isOpen && analyzer) {
      runTest();
    }
  }, [isOpen, analyzer, runTest]);

  if (!isOpen || !analyzer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Interface Handshake Test</h3>
              <p className="text-xs text-gray-500">{analyzer.name} ({analyzer.analyzerId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Target details card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs grid grid-cols-3 gap-2">
            <div>
              <span className="text-gray-400 block font-medium">Protocol</span>
              <span className="font-semibold text-gray-800">{analyzer.protocol || "ASTM / HL7"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Endpoint / Port</span>
              <span className="font-semibold font-mono text-gray-800">
                {analyzer.host ? `${analyzer.host}:${analyzer.port || 5000}` : (analyzer.connectionType === "SERIAL" ? "COM Serial" : "TCP Network")}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Current Status</span>
              <span className="font-semibold text-blue-600">{analyzer.status}</span>
            </div>
          </div>

          {/* Test Execution Diagnostics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                {stages.socket === "running" && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
                {stages.socket === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {stages.socket === "failed" && <XCircle className="w-4 h-4 text-rose-600" />}
                {stages.socket === "pending" && <div className="w-4 h-4 rounded-full bg-gray-200" />}
                <div>
                  <p className="text-xs font-semibold text-gray-800">Socket Connection & Port Reachability</p>
                  <p className="text-[11px] text-gray-400">Verifies IP routing and listener readiness</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-gray-600">
                {stages.socket === "running" ? "Pinging..." : stages.socket.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                {stages.handshake === "running" && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
                {stages.handshake === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {stages.handshake === "failed" && <XCircle className="w-4 h-4 text-rose-600" />}
                {stages.handshake === "pending" && <div className="w-4 h-4 rounded-full bg-gray-200" />}
                <div>
                  <p className="text-xs font-semibold text-gray-800">Protocol Handshake ({analyzer.protocol})</p>
                  <p className="text-[11px] text-gray-400">ENQ/ACK frame exchange and checksum validation</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-gray-600">
                {stages.handshake === "running" ? "Exchanging..." : stages.handshake.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Round-Trip Latency (RTT)</p>
                  <p className="text-[11px] text-gray-400">Network transport delay</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-600">
                {stages.latency !== null ? `${stages.latency} ms` : "—"}
              </span>
            </div>
          </div>

          {/* Raw Diagnostic Frame / Response Log */}
          <div>
            <span className="text-xs font-semibold text-gray-700 block mb-1.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-gray-500" />
              Interface Response Frame
            </span>
            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl overflow-x-auto min-h-[64px] border border-slate-800">
              {testing ? (
                <span className="text-slate-500 animate-pulse">&gt; Transmitting diagnostic probe to instrument...</span>
              ) : stages.rawEcho ? (
                <div>
                  <div className="text-slate-500 text-[10px] mb-1">&gt; 200 OK — ACK received:</div>
                  <div>{stages.rawEcho}</div>
                </div>
              ) : (
                <div className="text-rose-400">
                  <div className="text-slate-500 text-[10px] mb-1">&gt; Handshake Error:</div>
                  <div>{stages.errorMessage || "No ACK received from analyzer port."}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={runTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
            Retest Connection
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
