'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/dashboardlayout';
import OpdLiveQueue from '@/components/patients/OpdLiveQueue';

export default function OpdQueuePage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <OpdLiveQueue />
      </div>
    </DashboardLayout>
  );
}
