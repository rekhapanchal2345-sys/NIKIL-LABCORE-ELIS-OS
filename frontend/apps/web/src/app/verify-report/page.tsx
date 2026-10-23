// File: frontend/apps/web/src/app/verify-report/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, QrCode, Search, Lock, Award, ArrowRight } from 'lucide-react';

export default function VerifyReportLookupPage() {
  const router = useRouter();
  const [reportId, setReportId] = useState('');
  const [checksum, setChecksum] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = reportId.trim();
    if (!trimmedId) return;

    const query = new URLSearchParams();
    if (token.trim()) query.set('token', token.trim());
    if (checksum.trim()) query.set('checksum', checksum.trim());

    router.push(
      `/verify-report/${encodeURIComponent(trimmedId)}${
        query.toString() ? `?${query.toString()}` : ''
      }`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-teal-400" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <Award className="w-3 h-3" />
              NABL ISO 15189:2022 • MC-6184
            </span>
            <h1 className="text-xl font-bold text-white mt-1">
              Public Diagnostic Report Verification Portal
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Scan the cryptographic QR code printed on any official{' '}
          <strong className="text-slate-200">NIKIL-LABCORE-ELIS-OS</strong> laboratory report or
          enter the Report ID and SHA-256 Checksum below to verify its authenticity.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Report ID or Report Number *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                placeholder="e.g. RPT-ORD-2026-0001 or UUID"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Short SHA-256 Checksum (Optional)
              </label>
              <input
                type="text"
                value={checksum}
                onChange={(e) => setChecksum(e.target.value)}
                placeholder="16-char hex checksum"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                HMAC-SHA256 Token (Optional)
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="64-char HMAC signature"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition"
          >
            <Lock className="w-4 h-4" />
            Verify Cryptographic Authenticity
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-teal-400" />
            Supports ISO 15189:2022 Clause 7.4.1.7 Addendums
          </span>
          <span>DPDP Act 2023 Privacy Protected</span>
        </div>
      </div>
    </div>
  );
}
