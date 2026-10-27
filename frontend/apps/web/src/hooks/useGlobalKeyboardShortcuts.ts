"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShortcutHandlers {
  onToggleSearch?: () => void;
  onOpenQuickComms?: () => void;
}

/**
 * Global Keyboard Navigation & Shortcut Dispatcher
 * Provides standard hospital workflow hotkeys:
 * - Ctrl+K / Cmd+K: Open Command Palette / Global Search
 * - Ctrl+M: Open Quick Communication Slideover
 * - Alt+P: Register New Walk-In Patient
 * - Alt+O: Create Diagnostic Test Order
 * - Alt+S: Cash Shift Till & Cash Counter (/payments?tab=cash-counter)
 * - Alt+R: Verified Reports & PDF Dispatch
 * - Alt+Q: Pathologist Workstation & Approvals
 * - Alt+B: Specimen Accession & Phlebotomy
 * - Alt+D: Referring Doctors Directory
 * - Alt+T: Master Test Catalog
 */
export function useGlobalKeyboardShortcuts({
  onToggleSearch,
  onOpenQuickComms,
}: ShortcutHandlers = {}) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut key events inside text inputs or editable elements,
      // EXCEPT for Ctrl+K, Cmd+K, or Escape which should always take precedence
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // 1. Ctrl+K / Cmd+K -> Toggle Search / Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggleSearch?.();
        return;
      }

      // 2. Ctrl+M -> Quick Comms
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        onOpenQuickComms?.();
        return;
      }

      // If typing in an input field, do not trigger Alt+ single-letter navigation
      if (isInput) return;

      // 3. Alt-based Hospital Quick Action Hotkeys
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case "p":
            e.preventDefault();
            router.push("/patients?action=new");
            break;
          case "o":
            e.preventDefault();
            router.push("/orders/new");
            break;
          case "s":
            e.preventDefault();
            router.push("/payments?tab=cash-counter");
            break;
          case "r":
            e.preventDefault();
            router.push("/reports");
            break;
          case "q":
            e.preventDefault();
            router.push("/approvals");
            break;
          case "b":
            e.preventDefault();
            router.push("/samples");
            break;
          case "d":
            e.preventDefault();
            router.push("/doctors");
            break;
          case "t":
            e.preventDefault();
            router.push("/tests");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, onToggleSearch, onOpenQuickComms]);
}
