'use strict';
'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected client-side runtime exception to console
    console.error('[ELIS-OS Clinical Root Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-400 rounded-md">
                Application Exception
              </span>
              {error?.digest && (
                <span className="text-xs text-slate-500 font-mono">
                  Digest: {error.digest}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mt-2">
              Clinical Workspace Encountered an Unexpected Error
            </h1>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              The operation was halted safely by the diagnostic safety boundary to prevent data corruption.
              No uncommitted clinical records or laboratory results were modified.
            </p>
          </div>
        </div>

        {error?.message && (
          <div className="mt-6 p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono text-xs text-red-300 break-words max-h-32 overflow-y-auto">
            {error.message}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span>NABL / 21 CFR § 11 Audit Guard Active</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" />
              Return to Hub
            </Link>
            <button
              onClick={() => reset()}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg shadow-red-900/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Operation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
