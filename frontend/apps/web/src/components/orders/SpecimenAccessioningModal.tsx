"use client";

import React from "react";

export default function SpecimenAccessioningModal({
  isOpen,
  onClose,
}: {
  order?: any;
  isOpen?: boolean;
  onClose?: () => void;
  onAccessionSuccess?: (data: any) => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">
          Close
        </button>
      </div>
    </div>
  );
}
