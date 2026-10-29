"use client";
import React, { useState } from "react";

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  };
}

export function CommandPalette({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24 p-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-lg w-full shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Quick Command Palette</span>
          <button type="button" onClick={onClose} className="text-xs text-slate-500">ESC</button>
        </div>
        <input
          type="text"
          placeholder="Type a command or search..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>
    </div>
  );
}
export default CommandPalette;
