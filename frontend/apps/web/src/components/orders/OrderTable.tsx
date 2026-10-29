"use client";

import React from "react";

export interface LabOrder {
  id: string;
  orderNumber?: string;
  patientId?: string;
  patientName?: string;
  doctorName?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  [key: string]: any;
}

export default function OrderTable({ orders = [] }: { orders?: LabOrder[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
      Orders Count: {orders.length}
    </div>
  );
}
