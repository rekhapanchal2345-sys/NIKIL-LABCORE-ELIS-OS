'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LndtXOperationalConsole() {
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Read initial or current tab from search params
  const tabParam = searchParams.get('tab') || 'OVERVIEW';

  // Build iframe src with tab query param
  const iframeSrc = React.useMemo(() => {
    return `/lndt-x.html?tab=${encodeURIComponent(tabParam)}`;
  }, [tabParam]);

  // Sync tab changes between iframe and parent browser URL
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'TAB_CHANGED' && event.data.tab) {
        try {
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.get('tab') !== event.data.tab) {
            currentUrl.searchParams.set('tab', event.data.tab);
            window.history.replaceState({}, '', currentUrl.toString());
          }
        } catch {
          // ignore url state errors
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Post message to iframe when URL param changes after initial mount
  useEffect(() => {
    if (iframeLoaded && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { action: 'SELECT_TAB', tab: tabParam },
        '*'
      );
    }
  }, [tabParam, iframeLoaded]);

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-50 flex flex-col relative">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="LabCore Operational Digital Twin X (LNDT-X) Enterprise Platform"
        className="w-full h-full border-0 flex-1 block"
        style={{ width: '100%', height: '100vh', border: 'none' }}
        allow="fullscreen; clipboard-read; clipboard-write;"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  );
}
