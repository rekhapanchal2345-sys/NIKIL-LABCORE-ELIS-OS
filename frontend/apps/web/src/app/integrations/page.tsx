"use client";

import React from "react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import IntegrationEngineDashboard from "@/components/dashboard/IntegrationEngineDashboard";

export default function IntegrationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Hospital & Diagnostic Integration Engine">
        <div className="pb-12">
          <IntegrationEngineDashboard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
