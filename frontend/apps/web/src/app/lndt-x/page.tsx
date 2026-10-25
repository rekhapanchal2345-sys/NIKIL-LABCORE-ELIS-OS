'use client';

import React, { Suspense } from 'react';
import LndtXOperationalConsole from '@/components/digital-twin/LndtXOperationalConsole';

function LndtXLoadingFallback() {
    return (
        <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-semibold text-slate-800">
                    Loading LNDT-X Operational Digital Twin...
                </div>
                <div className="text-xs text-slate-500 font-mono">
                    Synchronizing 12-Stage Diagnostic Telemetry
                </div>
            </div>
        </div>
    );
}

export default function LndtXPage() {
    return (
        <main className="w-full min-h-screen bg-slate-50">
            <Suspense fallback={<LndtXLoadingFallback />}>
                <LndtXOperationalConsole />
            </Suspense>
        </main>
    );
}
