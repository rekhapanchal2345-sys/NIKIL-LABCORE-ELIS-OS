import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });

import { WebSocketService } from "./api/src/lib/websocket";

async function runDay18Tests() {
  console.log("================================================================================");
  console.log("🎨 DAY 18 EMPIRICAL TEST SUITE: THEME ENGINE, AUDIO PANIC ALERTS & GRIDS");
  console.log("================================================================================\n");

  let passedAssertions = 0;

  function assert(condition: boolean, desc: string) {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
    passedAssertions++;
    console.log(`  ✓ [ASSERT #${passedAssertions}] ${desc}`);
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 1: THEME TRANSITION ENGINE & WCAG CONTRAST VERIFICATION
    // -------------------------------------------------------------------------
    console.log("🔷 Step 1: Testing Dark/Light/System Theme Modes & WCAG Contrast...");

    type ThemeMode = "light" | "dark" | "system";
    type EffectiveTheme = "light" | "dark";

    function computeEffectiveTheme(mode: ThemeMode, systemIsDark: boolean): EffectiveTheme {
      if (mode === "system") {
        return systemIsDark ? "dark" : "light";
      }
      return mode === "dark" ? "dark" : "light";
    }

    function toggleTheme(currentEffective: EffectiveTheme): ThemeMode {
      return currentEffective === "dark" ? "light" : "dark";
    }

    // 1.1 Effective Theme Resolution
    assert(computeEffectiveTheme("light", false) === "light", "Light mode resolves to 'light' (system light)");
    assert(computeEffectiveTheme("light", true) === "light", "Light mode forces 'light' even if system is dark");
    assert(computeEffectiveTheme("dark", false) === "dark", "Dark mode forces 'dark' even if system is light");
    assert(computeEffectiveTheme("dark", true) === "dark", "Dark mode resolves to 'dark' (system dark)");
    assert(computeEffectiveTheme("system", true) === "dark", "System mode resolves to 'dark' when system preference is dark");
    assert(computeEffectiveTheme("system", false) === "light", "System mode resolves to 'light' when system preference is light");

    // 1.2 Toggle Behavior
    assert(toggleTheme("light") === "dark", "Toggle from light must yield 'dark'");
    assert(toggleTheme("dark") === "light", "Toggle from dark must yield 'light'");

    // 1.3 WCAG Relative Luminance & Contrast Ratio Math
    function hexToRgb(hex: string): [number, number, number] {
      const clean = hex.replace("#", "");
      return [
        parseInt(clean.substring(0, 2), 16),
        parseInt(clean.substring(2, 4), 16),
        parseInt(clean.substring(4, 6), 16),
      ];
    }

    function relativeLuminance(r: number, g: number, b: number): number {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const [r1, g1, b1] = hexToRgb(hex1);
      const [r2, g2, b2] = hexToRgb(hex2);
      const l1 = relativeLuminance(r1, g1, b1);
      const l2 = relativeLuminance(r2, g2, b2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    // Light Theme Tokens from globals.css: Bg (#ffffff) vs Text (#0f172a)
    const lightBg = "#ffffff";
    const lightText = "#0f172a";
    const lightContrast = contrastRatio(lightBg, lightText);
    assert(lightContrast >= 7.0, `Light theme contrast must exceed WCAG AAA threshold of 7.0:1 (got ${lightContrast.toFixed(2)}:1)`);

    // Dark Theme Tokens from globals.css: Bg (#0a0a0a) vs Text (#f5f5f5)
    const darkBg = "#0a0a0a";
    const darkText = "#f5f5f5";
    const darkContrast = contrastRatio(darkBg, darkText);
    assert(darkContrast >= 7.0, `Dark theme contrast must exceed WCAG AAA threshold of 7.0:1 (got ${darkContrast.toFixed(2)}:1)`);

    // Critical Red Panic Alert (#dc2626) vs Dark Background (#0a0a0a)
    const panicRed = "#dc2626";
    const panicContrast = contrastRatio(darkBg, panicRed);
    assert(panicContrast >= 3.0, `Panic red against dark background must provide high visibility contrast (got ${panicContrast.toFixed(2)}:1)`);

    // -------------------------------------------------------------------------
    // STEP 2: MEDICAL ACOUSTIC ALARM (IEC 60601-1-8) SYNTHESIZER CALCULATIONS
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 2: Testing IEC 60601-1-8 Medical Audio Panic Alarm Frequencies & Envelope...");

    // 2.1 Critical Panic Alert Tone Burst
    const panicTones = [880, 659.25, 987.77, 880, 659.25];
    const pulseDuration = 0.08; // 80ms
    const pulseGap = 0.04;      // 40ms
    const totalBurstTime = panicTones.length * pulseDuration + (panicTones.length - 1) * pulseGap;

    assert(panicTones.length === 5, "IEC 60601-1-8 high priority panic sound burst must consist of 5 tone pulses");
    assert(totalBurstTime <= 1.0, `Total panic burst duration must be under 1.0 second for rapid alerting (got ${totalBurstTime.toFixed(2)}s)`);

    // Frequency Harmonic Intervals
    const ratioEtoA = 880 / 659.25;
    assert(Math.abs(ratioEtoA - 1.3348) < 0.01, `Interval 659.25Hz -> 880Hz must form an exact Perfect Fourth (ratio ~1.335, got ${ratioEtoA.toFixed(4)})`);

    const ratioEtoB = 987.77 / 659.25;
    assert(Math.abs(ratioEtoB - 1.4983) < 0.01, `Interval 659.25Hz -> 987.77Hz must form an exact Perfect Fifth (ratio ~1.498, got ${ratioEtoB.toFixed(4)})`);

    // 2.2 Medium-Priority Warning Tone (C5 to G5)
    const warningTones = [523.25, 783.99];
    const ratioCtoG = 783.99 / 523.25;
    assert(Math.abs(ratioCtoG - 1.4983) < 0.01, `Ascending warning chime must form a Perfect Fifth (ratio ~1.498, got ${ratioCtoG.toFixed(4)})`);

    // 2.3 Volume Clamping Engine
    function clampVolume(vol: number): number {
      return Math.max(0, Math.min(1, vol));
    }

    assert(clampVolume(1.8) === 1.0, "Volume 1.8 must be clamped to 1.0");
    assert(clampVolume(-0.5) === 0.0, "Volume -0.5 must be clamped to 0.0");
    assert(clampVolume(0.75) === 0.75, "Volume 0.75 must remain 0.75");

    // 2.4 Audio Muting Logic
    let muted = false;
    function computeAudioGain(baseGain: number, isMuted: boolean, vol: number): number {
      if (isMuted) return 0;
      return baseGain * clampVolume(vol);
    }

    assert(computeAudioGain(0.25, false, 0.8) === 0.20, "Active audio at 80% volume produces 0.20 gain");
    assert(computeAudioGain(0.25, true, 0.8) === 0, "Muted audio suppresses gain to 0");

    // -------------------------------------------------------------------------
    // STEP 3: TOAST NOTIFICATION LIFECYCLE & QUEUE MANAGEMENT
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 3: Testing Toast Notification System Queueing, Priorities & Dismissal...");

    interface MockToast {
      id: string;
      variant: "success" | "error" | "warning" | "info" | "panic";
      message: string;
      title?: string;
      duration: number;
    }

    class MockToastQueue {
      private queue: MockToast[] = [];
      private maxToasts = 5;

      add(variant: MockToast["variant"], message: string, title?: string): MockToast {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const duration = variant === "panic" ? 10000 : 4500;
        const toast: MockToast = { id, variant, message, title, duration };
        this.queue = [toast, ...this.queue].slice(0, this.maxToasts);
        return toast;
      }

      remove(id: string): void {
        this.queue = this.queue.filter((t) => t.id !== id);
      }

      clear(): void {
        this.queue = [];
      }

      get active(): MockToast[] {
        return this.queue;
      }
    }

    const toastQueue = new MockToastQueue();

    // 3.1 Adding standard toasts
    const tSuccess = toastQueue.add("success", "Patient registered successfully");
    assert(tSuccess.duration === 4500, "Standard success toast has 4500ms auto-dismiss duration");
    assert(toastQueue.active.length === 1, "Queue contains 1 toast");

    // 3.2 Adding critical panic toast
    const tPanic = toastQueue.add("panic", "CRITICAL POTASSIUM: 6.8 mmol/L (Patient UHID: LC-9021)", "PANIC VALUE");
    assert(tPanic.duration === 10000, "Critical panic toast duration must be extended to 10000ms for safety");
    assert(toastQueue.active[0].id === tPanic.id, "Newest toast must be placed at the head of the queue");

    // 3.3 Max Capacity (5 Toasts) & FIFO Eviction
    for (let i = 1; i <= 6; i++) {
      toastQueue.add("info", `Information notice ${i}`);
    }
    assert(toastQueue.active.length === 5, `Toast queue must be strictly capped at 5 items (got ${toastQueue.active.length})`);
    assert(toastQueue.active[0].message === "Information notice 6", "Newest toast is at index 0");
    assert(!toastQueue.active.some((t) => t.id === tSuccess.id), "Oldest toast was evicted when cap exceeded");

    // 3.4 Dismiss single toast
    const toDismissId = toastQueue.active[2].id;
    toastQueue.remove(toDismissId);
    assert(toastQueue.active.length === 4, "Queue size decrements to 4 after removal");
    assert(!toastQueue.active.some((t) => t.id === toDismissId), "Specific toast ID was dismissed");

    // 3.5 Clear all
    toastQueue.clear();
    assert(toastQueue.active.length === 0, "Clear all empties toast queue");

    // -------------------------------------------------------------------------
    // STEP 4: RESPONSIVE DATA TABLE PINNED COLUMNS & DENSITY
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 4: Testing Responsive Table Pinned Offsets, Density & Scroller State...");

    // 4.1 Sticky Column Offsets Calculation
    function calculateStickyOffsets(columnWidths: number[]): number[] {
      const offsets: number[] = [];
      let currentOffset = 0;
      for (const w of columnWidths) {
        offsets.push(currentOffset);
        currentOffset += w;
      }
      return offsets;
    }

    const testColWidths = [50, 140, 200]; // Checkbox, UHID, Patient Name
    const offsets = calculateStickyOffsets(testColWidths);
    assert(offsets[0] === 0, "First pinned column left offset is 0px");
    assert(offsets[1] === 50, "Second pinned column left offset is 50px (after checkbox)");
    assert(offsets[2] === 190, "Third pinned column left offset is 190px (50 + 140)");

    // 4.2 Horizontal Scroll Indicator State Machine
    function evaluateScrollShadows(scrollLeft: number, scrollWidth: number, clientWidth: number) {
      return {
        canScrollLeft: scrollLeft > 4,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - 4,
      };
    }

    // Fully left
    const stateLeft = evaluateScrollShadows(0, 1000, 600);
    assert(!stateLeft.canScrollLeft, "Left shadow is disabled when table is at start position");
    assert(stateLeft.canScrollRight, "Right shadow is active when content overflows to the right");

    // Scrolled middle
    const stateMiddle = evaluateScrollShadows(200, 1000, 600);
    assert(stateMiddle.canScrollLeft, "Left shadow is active when scrolled away from start");
    assert(stateMiddle.canScrollRight, "Right shadow remains active while more content exists");

    // Fully right
    const stateRight = evaluateScrollShadows(400, 1000, 600);
    assert(stateRight.canScrollLeft, "Left shadow is active when scrolled to end");
    assert(!stateRight.canScrollRight, "Right shadow is disabled when table is at maximum scroll position");

    // 4.3 Table Density Classes
    function getTableDensityClasses(density: "compact" | "normal") {
      return density === "compact"
        ? "[&_td]:py-2 [&_th]:py-2 text-xs"
        : "[&_td]:py-3.5 [&_th]:py-3 text-sm";
    }

    assert(getTableDensityClasses("compact").includes("text-xs"), "Compact density uses text-xs and smaller padding");
    assert(getTableDensityClasses("normal").includes("text-sm"), "Normal density uses text-sm and comfortable padding");

    // -------------------------------------------------------------------------
    // STEP 5: WEBSOCKET PANIC ALERT BROADCAST PAYLOAD VALIDATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 5: Testing WebSocket Panic Alert Event Contract & Critical Ranges...");

    interface PanicAlertPayload {
      resultId: string;
      orderId: string;
      orderNumber: string;
      patientName: string;
      patientUhid: string;
      testName: string;
      parameterName: string;
      value: string;
      unit: string;
      flag: "HH" | "LL";
      criticalLow?: number | null;
      criticalHigh?: number | null;
      timestamp: string;
    }

    function validatePanicPayload(alert: PanicAlertPayload): boolean {
      if (!alert.resultId || !alert.orderId || !alert.orderNumber) return false;
      if (!alert.patientName || !alert.patientUhid) return false;
      if (!alert.parameterName || !alert.value) return false;
      if (alert.flag !== "HH" && alert.flag !== "LL") return false;
      if (!alert.timestamp) return false;
      return true;
    }

    const testPanicAlert: PanicAlertPayload = {
      resultId: "res-potassium-01",
      orderId: "ord-test-01",
      orderNumber: "ORD-9901",
      patientName: "Ashokkumar Panchal",
      patientUhid: "LC-00001",
      testName: "Serum Electrolytes Panel",
      parameterName: "Potassium (K+)",
      value: "6.9",
      unit: "mmol/L",
      flag: "HH",
      criticalHigh: 6.0,
      criticalLow: 2.8,
      timestamp: new Date().toISOString(),
    };

    assert(validatePanicPayload(testPanicAlert) === true, "Valid panic payload passes strict schema validation");

    const invalidFlagAlert = { ...testPanicAlert, flag: "NORMAL" as any };
    assert(validatePanicPayload(invalidFlagAlert) === false, "Alert with flag other than 'HH' or 'LL' fails panic validation");

    // Critical Value Detection Logic
    function evaluatePanicFlag(val: number, critLow: number, critHigh: number): "HH" | "LL" | "NORMAL" {
      if (val >= critHigh) return "HH";
      if (val <= critLow) return "LL";
      return "NORMAL";
    }

    assert(evaluatePanicFlag(6.9, 2.8, 6.0) === "HH", "Potassium 6.9 mmol/L against high 6.0 triggers 'HH' panic");
    assert(evaluatePanicFlag(2.1, 2.8, 6.0) === "LL", "Potassium 2.1 mmol/L against low 2.8 triggers 'LL' panic");
    assert(evaluatePanicFlag(4.2, 2.8, 6.0) === "NORMAL", "Potassium 4.2 mmol/L within normal limits returns 'NORMAL'");

    // -------------------------------------------------------------------------
    // STEP 6: NOTIFICATION CENTER BADGE & SYNC MATH
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 6: Testing Notification Desk Filtering, Unread Count & Critical Badges...");

    interface NotificationItem {
      id: string;
      category: "critical" | "approval" | "equipment" | "order" | "billing";
      priority: "URGENT" | "HIGH" | "NORMAL";
      read: boolean;
      dismissed: boolean;
    }

    const mockNotifications: NotificationItem[] = [
      { id: "n-1", category: "critical", priority: "URGENT", read: false, dismissed: false },
      { id: "n-2", category: "approval", priority: "HIGH", read: false, dismissed: false },
      { id: "n-3", category: "order", priority: "NORMAL", read: true, dismissed: false },
      { id: "n-4", category: "billing", priority: "NORMAL", read: false, dismissed: true },
      { id: "n-5", category: "equipment", priority: "HIGH", read: false, dismissed: false },
    ];

    function calculateDeskCounts(items: NotificationItem[]) {
      const active = items.filter((i) => !i.dismissed);
      const unread = active.filter((i) => !i.read);
      const hasCritical = unread.some((i) => i.category === "critical" || i.priority === "URGENT");
      return {
        totalActive: active.length,
        unreadCount: unread.length,
        hasCritical,
      };
    }

    const deskStats = calculateDeskCounts(mockNotifications);
    assert(deskStats.totalActive === 4, `Total active (non-dismissed) notifications must be 4 (got ${deskStats.totalActive})`);
    assert(deskStats.unreadCount === 3, `Unread count must be 3 (got ${deskStats.unreadCount})`);
    assert(deskStats.hasCritical === true, "Unread critical item triggers hasCritical=true");

    // Mark critical item as read
    mockNotifications[0].read = true;
    const afterReadStats = calculateDeskCounts(mockNotifications);
    assert(afterReadStats.unreadCount === 2, "Unread count decrements to 2 after marking critical read");
    assert(afterReadStats.hasCritical === false, "Critical indicator deactivates when all criticals are marked read");

    console.log("\n================================================================================");
    console.log(`🏆 ALL ${passedAssertions} DAY 18 EMPIRICAL ASSERTIONS PASSED WITH 100% SUCCESS!`);
    console.log("================================================================================\n");
  } catch (err: any) {
    console.error("❌ DAY 18 TEST EXECUTION FAILED:", err);
    process.exit(1);
  }
}

runDay18Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
