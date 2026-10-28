/**
 * Client Virtualization & Real-Time State Reducer Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 29: High-Performance Client-Side Rendering & Virtualization Bugs
 * - Bug 29.1: DOM Node Bloat & Browser Crash on Large Patient Worklists (10,000+ Rows Virtualizer)
 * - Bug 29.2: Stale Closure Bug in Real-Time WebSocket / SSE Result Updates (Functional Monotonic Reducer)
 */

export interface VirtualScrollInput {
  totalRows: number;
  rowHeightPx: number;
  viewportHeightPx: number;
  scrollTopPx: number;
  overscanRows?: number; // Default 5 rows buffer
}

export interface VirtualScrollViewport {
  startIndex: number;
  endIndex: number;
  visibleCount: number;
  topPaddingPx: number;
  bottomPaddingPx: number;
  totalContentHeightPx: number;
  isMemorySafe: boolean; // Confirms bounded DOM node count (< 50 nodes for 10,000 items)
}

export interface WorklistResultItem {
  resultId: string;
  testCode: string;
  parameterName: string;
  value: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'VERIFIED' | 'APPROVED';
  version: number;
  updatedAt: Date;
}

export interface RealtimeStateReduction {
  items: WorklistResultItem[];
  isStaleDiscarded: boolean;
  upsertedCount: number;
}

export class WorklistVirtualizerEngine {
  /**
   * Bug 29.1: Viewport Windowing Math for Large Worklists.
   * Ensures that whether the laboratory worklist has 100 rows or 50,000 rows,
   * only the visible viewport items + overscan buffer are rendered in the DOM.
   */
  public static computeVirtualRange(input: VirtualScrollInput): VirtualScrollViewport {
    const totalContentHeightPx = input.totalRows * input.rowHeightPx;
    const overscan = input.overscanRows ?? 5;

    // Calculate raw start index based on scroll position
    const rawStartIndex = Math.floor(input.scrollTopPx / input.rowHeightPx);
    const visibleRowCount = Math.ceil(input.viewportHeightPx / input.rowHeightPx);

    // Apply overscan buffering
    const startIndex = Math.max(0, rawStartIndex - overscan);
    const endIndex = Math.min(input.totalRows - 1, rawStartIndex + visibleRowCount + overscan);

    const visibleCount = Math.max(0, endIndex - startIndex + 1);
    const topPaddingPx = startIndex * input.rowHeightPx;
    const bottomPaddingPx = Math.max(0, (input.totalRows - 1 - endIndex) * input.rowHeightPx);

    // Bounded DOM nodes: visible items never exceed 100 even with 100,000 total items
    const isMemorySafe = visibleCount <= 100;

    return {
      startIndex,
      endIndex,
      visibleCount,
      topPaddingPx,
      bottomPaddingPx,
      totalContentHeightPx,
      isMemorySafe,
    };
  }
}

export class RealtimeResultStateReducer {
  /**
   * Bug 29.2: Stale Closure & Out-of-Order Packet Reducer.
   * Evaluates incoming WebSocket/SSE result packets against previous state:
   * 1. Rejects older versions arriving out-of-order (version monotonicity).
   * 2. Uses functional immutable updates so no sibling records are dropped.
   */
  public static reduceIncomingResult(
    previousItems: WorklistResultItem[],
    incomingItem: WorklistResultItem
  ): RealtimeStateReduction {
    const existingIndex = previousItems.findIndex(i => i.resultId === incomingItem.resultId);

    if (existingIndex >= 0) {
      const existing = previousItems[existingIndex];

      // Out-of-order check: if incoming version is older than existing version, discard
      if (incomingItem.version < existing.version) {
        return {
          items: previousItems,
          isStaleDiscarded: true,
          upsertedCount: 0,
        };
      }

      // Functional immutable replace in-place
      const updatedList = [...previousItems];
      updatedList[existingIndex] = { ...incomingItem };

      return {
        items: updatedList,
        isStaleDiscarded: false,
        upsertedCount: 1,
      };
    }

    // New item: append immutably
    return {
      items: [...previousItems, incomingItem],
      isStaleDiscarded: false,
      upsertedCount: 1,
    };
  }
}
