/**
 * useWebSocket — Real-time clinical event hook
 * Connects to the LabCore backend Socket.io server and listens for:
 *  - panic_alert_new    : Critical HH/LL result fired
 *  - result_entered     : Lab tech submitted results
 *  - sample_status_changed : 7-stage specimen state machine update
 *  - approval_signoff   : Pathologist signed off
 *  - report_ready       : NABL PDF generated
 *  - dashboard_kpi_update : Live KPI delta
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PanicAlertPayload {
  resultId: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  patientUhid: string;
  testName: string;
  parameterName: string;
  value: string;
  unit: string;
  flag: 'HH' | 'LL';
  criticalLow?: number | null;
  criticalHigh?: number | null;
  timestamp: string;
}

export interface ResultEnteredPayload {
  orderId: string;
  orderNumber: string;
  patientName: string;
  resultId: string;
  testName: string;
  status: string;
  hasAbnormal: boolean;
  hasPanic: boolean;
}

export interface SampleStatusPayload {
  sampleId: string;
  sampleBarcode: string;
  orderId: string;
  patientName: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface ApprovalSignOffPayload {
  approvalId: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  doctorName: string;
  status: 'APPROVED' | 'REJECTED' | 'AMENDED';
  timestamp: string;
}

export interface ReportReadyPayload {
  reportId: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  patientUhid: string;
  reportUrl: string;
  pathologistName: string;
  generatedAt: string;
}

export interface DashboardKpiPayload {
  todayPatients?: number;
  pendingApprovals?: number;
  criticalAlerts?: number;
  reportsGenerated?: number;
  todayRevenue?: number;
}

export interface WebSocketHandlers {
  onPanicAlert?: (data: PanicAlertPayload) => void;
  onResultEntered?: (data: ResultEnteredPayload) => void;
  onSampleStatusChanged?: (data: SampleStatusPayload) => void;
  onApprovalSignOff?: (data: ApprovalSignOffPayload) => void;
  onReportReady?: (data: ReportReadyPayload) => void;
  onDashboardKpiUpdate?: (data: DashboardKpiPayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWebSocket(handlers: WebSocketHandlers = {}) {
  const { user } = useAuth();
  const socketRef = useRef<any>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref current without re-connecting
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (socketRef.current?.connected) return;

    try {
      // Lazy import to avoid SSR issues
      const { io } = await import('socket.io-client');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('labcore_access_token') ||
                    sessionStorage.getItem('labcore_access_token') || '';

      const socket = io(apiUrl, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[WS] Connected to LabCore real-time server');
        handlersRef.current.onConnect?.();
      });

      socket.on('disconnect', (reason: string) => {
        console.log('[WS] Disconnected:', reason);
        handlersRef.current.onDisconnect?.();
      });

      // ── Clinical Events ────────────────────────────────────────────
      socket.on('panic_alert_new', (data: PanicAlertPayload) => {
        console.warn('[WS] 🚨 PANIC ALERT:', data.parameterName, data.flag, data.orderNumber);
        handlersRef.current.onPanicAlert?.(data);
      });

      socket.on('result_entered', (data: ResultEnteredPayload) => {
        handlersRef.current.onResultEntered?.(data);
      });

      socket.on('sample_status_changed', (data: SampleStatusPayload) => {
        handlersRef.current.onSampleStatusChanged?.(data);
      });

      socket.on('approval_signoff', (data: ApprovalSignOffPayload) => {
        handlersRef.current.onApprovalSignOff?.(data);
      });

      socket.on('report_ready', (data: ReportReadyPayload) => {
        handlersRef.current.onReportReady?.(data);
      });

      socket.on('dashboard_kpi_update', (data: DashboardKpiPayload) => {
        handlersRef.current.onDashboardKpiUpdate?.(data);
      });

    } catch (err) {
      console.warn('[WS] Could not connect to real-time server:', err);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
}
