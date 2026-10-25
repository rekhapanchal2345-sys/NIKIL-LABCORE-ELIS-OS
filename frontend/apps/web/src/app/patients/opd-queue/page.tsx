'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/dashboardlayout';
import OpdLiveQueue from '@/components/patients/OpdLiveQueue';

export default function OpdQueuePage() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1700px] mx-auto space-y-6">
        <OpdLiveQueue />
      </div>
    </DashboardLayout>
  );
}
