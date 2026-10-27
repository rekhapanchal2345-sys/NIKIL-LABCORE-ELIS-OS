'use client';

import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Download,
  DollarSign,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { Invoice } from './InvoiceTable';

interface TpaClaimsCenterProps {
  invoices: Invoice[];
  onRefresh?: () => void;
  onCollectCopay?: (invoice: Invoice) => void;
  onPrintA4?: (invoice: Invoice) => void;
}

interface TpaClaimRecord {
  id: string;
  claimNumber: string;
  preAuthNumber: string;
  invoiceNumber: string;
  patientName: string;
  patientUhid: string;
  patientPhone: string;
  tpaProvider: string;
  corporatePolicyNumber: string;
  estimatedAmount: number;
  approvedAmount: number;
  copayAmount: number;
  copayPaid: boolean;
  status: 'PRE_AUTH_APPROVED' | 'SUBMITTED' | 'UNDER_QUERY' | 'SETTLED' | 'REJECTED';
  submittedDate: string;
  settledDate?: string;
  deductionAmount?: number;
}

export default function TpaClaimsCenter({
  invoices,
  onRefresh,
  onCollectCopay,
  onPrintA4,
}: TpaClaimsCenterProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Claims are shown only when the connected invoice record carries an
  // insurance/TPA payment mode. No sample claims are displayed.
  const claims = invoices
    .filter((invoice) => ["TPA", "INSURANCE", "CASHLESS"].includes((invoice.paymentMode || "").toUpperCase()))
    .map<TpaClaimRecord>((invoice) => ({
      id: String(invoice.id),
      claimNumber: String((invoice as any).claimNumber || "—"),
      preAuthNumber: String((invoice as any).preAuthNumber || "—"),
      invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id}`,
      patientName: invoice.patientName || "—",
      patientUhid: invoice.patientUhid || "—",
      patientPhone: invoice.patientPhone || "",
      tpaProvider: String((invoice as any).tpaProvider || "Unassigned"),
      corporatePolicyNumber: String((invoice as any).policyNumber || "—"),
      estimatedAmount: Number(invoice.netPayable || 0),
      approvedAmount: Number((invoice as any).approvedAmount || invoice.netPayable || 0),
      copayAmount: Number((invoice as any).copayAmount || 0),
      copayPaid: Number((invoice as any).copayAmount || 0) === 0,
      status: ((invoice.paymentStatus || "SUBMITTED").toUpperCase() === "PAID" ? "SETTLED" : "SUBMITTED") as TpaClaimRecord["status"],
      submittedDate: invoice.createdAt || "—",
    }));

  const filteredClaims = claims.filter((claim) => {
    if (selectedProvider !== 'ALL' && !claim.tpaProvider.toLowerCase().includes(selectedProvider.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        claim.claimNumber.toLowerCase().includes(q) ||
        claim.preAuthNumber.toLowerCase().includes(q) ||
        claim.patientName.toLowerCase().includes(q) ||
        claim.patientUhid.toLowerCase().includes(q) ||
        claim.invoiceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPreAuthValue = claims.reduce((acc, c) => acc + c.approvedAmount, 0);
  const totalSettledValue = claims.filter(c => c.status === 'SETTLED').reduce((acc, c) => acc + c.approvedAmount, 0);
  const totalPendingSettlement = claims.filter(c => c.status !== 'SETTLED' && c.status !== 'REJECTED').reduce((acc, c) => acc + c.approvedAmount, 0);

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Pre-Auth Value</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            ₹{totalPreAuthValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {claims.length} Active Cashless Hospital Invoices
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Awaiting TPA Settlement</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-900 font-mono">
            ₹{totalPendingSettlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Reconciliation cycle: 7-14 business days
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Settled & Realized</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-emerald-700 font-mono">
            ₹{totalSettledValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Direct NEFT credits into hospital billing account
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Patient Co-Pay Collected</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
             ₹{claims.reduce((total, claim) => total + claim.copayAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
             Patient share recorded on connected claims
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Providers' },
            { id: 'Star', label: 'Star Health' },
            { id: 'MediAssist', label: 'MediAssist' },
            { id: 'Vidal', label: 'Vidal Health' },
            { id: 'ICICI', label: 'ICICI Lombard' },
          ].map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setSelectedProvider(provider.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${selectedProvider === provider.id
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              {provider.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Claim #, Pre-Auth, Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm"
              title="Refresh Claims"
            >
              <RefreshCw className="w-4 h-4 text-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Claim &amp; Pre-Auth #</th>
                <th className="py-3.5 px-4">Patient &amp; Policy</th>
                <th className="py-3.5 px-4">TPA Insurer</th>
                <th className="py-3.5 px-4 text-right">Pre-Auth Approved (₹)</th>
                <th className="py-3.5 px-4 text-right">Patient Co-Pay (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/70 transition">
                  {/* Claim & Pre-auth numbers */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-blue-700 font-mono">{claim.claimNumber}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Pre-Auth: <span className="font-mono font-semibold text-slate-800">{claim.preAuthNumber}</span></div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Inv: {claim.invoiceNumber}</div>
                  </td>

                  {/* Patient Info */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-slate-900">{claim.patientName}</div>
                    <div className="text-[11px] text-slate-500">{claim.patientUhid} • {claim.patientPhone}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Policy: {claim.corporatePolicyNumber}</div>
                  </td>

                  {/* Insurer Provider */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-800">{claim.tpaProvider}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Submitted: {claim.submittedDate}</div>
                  </td>

                  {/* Pre-auth Amount */}
                  <td className="py-3.5 px-4 align-top text-right font-mono">
                    <div className="font-bold text-slate-900 text-sm">
                      ₹{claim.approvedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Est: ₹{claim.estimatedAmount.toLocaleString('en-IN')}
                    </div>
                  </td>

                  {/* Co-pay */}
                  <td className="py-3.5 px-4 align-top text-right font-mono">
                    <div className="font-bold text-purple-700">
                      ₹{claim.copayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
                      ✓ Settled at Counter
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 align-top text-center">
                    {claim.status === 'PRE_AUTH_APPROVED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        ● Pre-Auth Approved
                      </span>
                    )}
                    {claim.status === 'SUBMITTED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ● Claim Submitted
                      </span>
                    )}
                    {claim.status === 'UNDER_QUERY' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        ● Under Query
                      </span>
                    )}
                    {claim.status === 'SETTLED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Settled by TPA
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                        title="Download Pre-Auth Slip"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 shadow-sm"
                      >
                        Reconcile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
