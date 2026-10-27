'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, Clock, ExternalLink, FlaskConical, RefreshCw } from 'lucide-react';
import { orderApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

type EncounterType = 'OPD' | 'IPD' | 'EMERGENCY_STAT' | 'ICU' | 'DAYCARE';

interface StatOrderCardItem {
  id: string;
  orderNumber: string;
  patientName: string;
  encounterType: EncounterType;
  biomarkerCodes: string[];
  createdAt: string;
  sampleCollected: boolean;
  priority: 'STAT' | 'URGENT';
}

function formatElapsed(createdAt: string, now: number) {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return 'Age unavailable';
  const minutes = Math.max(0, Math.floor((now - created) / 60000));
  if (minutes < 60) return `${minutes} min elapsed`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m elapsed`;
}

export default function EmergencyStatTriageWorkstationPage() {
  const [queue, setQueue] = useState<StatOrderCardItem[]>([]);
  const [filterEncounter, setFilterEncounter] = useState<'ALL' | EncounterType>('ALL');
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await orderApi.getAll('page=1&limit=100');
      const orders = response?.data?.orders || response?.data || [];
      const priorityOrders = (Array.isArray(orders) ? orders : [])
        .filter((order: any) => ['STAT', 'URGENT'].includes(String(order.priority || '').toUpperCase()))
        .filter((order: any) => !['COMPLETED', 'CANCELLED'].includes(String(order.orderStatus || '').toUpperCase()))
        .map((order: any): StatOrderCardItem => ({
          id: order.id,
          orderNumber: order.orderNumber,
          patientName: `${order.patient?.firstName || ''} ${order.patient?.lastName || ''}`.trim() || 'Unnamed patient',
          encounterType: 'OPD',
          biomarkerCodes: (order.items || [])
            .map((item: any) => item.test?.testCode || item.test?.testName)
            .filter(Boolean),
          createdAt: order.createdAt,
          sampleCollected: Boolean(order.sampleCollected),
          priority: String(order.priority || '').toUpperCase() === 'STAT' ? 'STAT' : 'URGENT',
        }));
      setQueue(priorityOrders);
      setLastUpdated(new Date());
    } catch (loadError: any) {
      setQueue([]);
      setError(loadError?.message || 'Unable to load priority orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const clock = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(clock);
  }, []);

  const filteredQueue = queue.filter((item) =>
    filterEncounter === 'ALL' ? true : item.encounterType === filterEncounter
  );

  return (
    <ProtectedRoute>
      <DashboardLayout title="Priority Order Review">
        <div className="min-h-full bg-slate-50 p-4 text-slate-900 sm:p-6">
          <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
              <Activity className="h-4 w-4" />
              Priority order review
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              STAT and urgent order queue
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-500">
              Review active priority orders, specimen status and elapsed time. Turnaround targets are shown only when configured by the laboratory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Loading queue'}
            </span>
            <button
              type="button"
              onClick={loadQueue}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-sky-800"
            >
              Register priority order <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'EMERGENCY_STAT', 'ICU', 'IPD', 'DAYCARE', 'OPD'] as const).map((encounter) => (
              <button
                key={encounter}
                type="button"
                onClick={() => setFilterEncounter(encounter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filterEncounter === encounter
                    ? 'bg-rose-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                {encounter === 'ALL' ? 'All encounters' : encounter.replace('_', ' ')}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-500">{filteredQueue.length} active priority orders</span>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="space-y-3 lg:col-span-8">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                Loading priority orders…
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-3 text-sm font-bold text-slate-800">No active STAT or urgent orders</p>
                <p className="mt-1 text-xs text-slate-500">Priority orders received through the configured order workflow will appear here.</p>
              </div>
            ) : (
              filteredQueue.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2.5 py-0.5 text-xs font-extrabold text-white ${item.priority === 'STAT' ? 'bg-rose-700' : 'bg-amber-600'}`}>
                          {item.priority}
                        </span>
                        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {item.encounterType}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600">{item.orderNumber}</span>
                      </div>
                      <h2 className="mt-2 text-lg font-bold text-slate-900">{item.patientName}</h2>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-500" /> Order age
                      </div>
                      <p className="mt-1 font-mono text-base font-bold text-slate-900">{formatElapsed(item.createdAt, now)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investigations</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {item.biomarkerCodes.length > 0 ? item.biomarkerCodes.map((code) => (
                          <span key={code} className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-800">{code}</span>
                        )) : <span className="text-xs text-slate-500">Not available</span>}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Specimen status</p>
                      <p className={`mt-1 inline-flex items-center gap-1.5 text-xs font-bold ${item.sampleCollected ? 'text-emerald-700' : 'text-amber-700'}`}>
                        <FlaskConical className="h-3.5 w-3.5" />
                        {item.sampleCollected ? 'Collected' : 'Collection pending'}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="lg:col-span-4">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900">Register a priority order</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Use the standard requisition workflow to select the patient, investigations, priority, collection requirements and payment details. This keeps the patient and order record linked to the database.
              </p>
              <Link href="/orders/new" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-sky-800">
                Open order registration <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <div className="mt-4 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500">
                <p className="font-bold text-slate-700">Operational note</p>
                <p className="mt-1">Elapsed time is calculated from the recorded order timestamp. No local or simulated orders are created from this queue.</p>
              </div>
            </div>
          </aside>
        </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
