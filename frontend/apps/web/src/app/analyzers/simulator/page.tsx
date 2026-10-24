"use client";

import React from "react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NexusStoreProvider } from "@/components/nexus/useNexusStore";
import VirtualAnalyzerMasterDeck from "@/components/analyzers/VirtualAnalyzerMasterDeck";

export default function VirtualAnalyzerSimulatorPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <NexusStoreProvider>
          <div className="-m-4 md:-m-6">
            <VirtualAnalyzerMasterDeck />
          </div>
        </NexusStoreProvider>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
