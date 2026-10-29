"use client";
import React from "react";

export function RolesManagementView(props: any) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">RBAC Role Matrix</h3>
      <p className="text-sm text-slate-600">Role-based permissions for Super Admin, Pathologist, Lab Technician, and Front Desk.</p>
    </div>
  );
}
export default RolesManagementView;
