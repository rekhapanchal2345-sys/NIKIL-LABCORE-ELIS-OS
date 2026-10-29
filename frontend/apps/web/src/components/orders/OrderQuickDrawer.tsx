"use client";

import React from "react";

export interface DrawerOrder {
  id: string;
  orderNumber?: string;
  [key: string]: any;
}

export default function OrderQuickDrawer({
  order,
  isOpen,
  onClose,
}: {
  order?: DrawerOrder | null;
  isOpen?: boolean;
  onClose?: () => void;
  [key: string]: any;
}) {
  if (!isOpen || !order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Order {order.orderNumber || order.id}</h3>
          <button type="button" onClick={onClose} className="text-xs font-bold text-slate-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
