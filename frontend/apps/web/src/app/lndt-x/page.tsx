'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const LndtXOperationalConsole = dynamic(
  () => import('@/components/digital-twin/LndtXOperationalConsole'),
  { ssr: false }
);

function LndtXLoadingFallback() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-semibold text-slate-800">
          Loading Unified INDT-X Enterprise Intelligence Console...
        </div>
      </div>
    </div>
  );
}

export default function LndtXPage() {
  return (
    <main className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Suspense fallback={<LndtXLoadingFallback />}>
        <LndtXOperationalConsole />
      </Suspense>
    </main>
  );
}

