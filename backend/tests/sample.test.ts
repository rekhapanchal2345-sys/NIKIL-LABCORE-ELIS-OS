/**
 * Domain Test Suite: CLSI GP41 Sample Lifecycle & Vacutainer Tube Mapping
 */

import { describe, it, expect } from "./framework";

export type SampleState = "PENDING" | "COLLECTED" | "RECEIVED" | "PROCESSING" | "COMPLETED" | "REJECTED";

export class SampleStateMachine {
  private static readonly VALID_TRANSITIONS: Record<SampleState, SampleState[]> = {
    PENDING: ["COLLECTED", "REJECTED"],
    COLLECTED: ["RECEIVED", "REJECTED"],
    RECEIVED: ["PROCESSING", "REJECTED"],
    PROCESSING: ["COMPLETED", "REJECTED"],
    COMPLETED: [], // Terminal success state
    REJECTED: ["COLLECTED"], // Permitted to recollected
  };

  public static canTransition(current: SampleState, next: SampleState): boolean {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static transition(current: SampleState, next: SampleState, rejectionReason?: string): SampleState {
    if (next === "REJECTED" && (!rejectionReason || rejectionReason.trim().length === 0)) {
      throw new Error("CLSI GP41 requires an explicit clinical rejection reason (e.g. Hemolysis, Insufficient Volume)");
    }

    if (!this.canTransition(current, next)) {
      throw new Error(`Illegal state transition from ${current} to ${next}`);
    }

    return next;
  }
}

export function registerSampleTests(): void {
  describe("CLSI GP41 Sample Lifecycle State Machine & Specimen Containers", () => {
    it("should allow valid forward clinical transitions", () => {
      let state: SampleState = "PENDING";

      state = SampleStateMachine.transition(state, "COLLECTED");
      expect(state).toBe("COLLECTED");

      state = SampleStateMachine.transition(state, "RECEIVED");
      expect(state).toBe("RECEIVED");

      state = SampleStateMachine.transition(state, "PROCESSING");
      expect(state).toBe("PROCESSING");

      state = SampleStateMachine.transition(state, "COMPLETED");
      expect(state).toBe("COMPLETED");
    });

    it("should block illegal shortcut transitions (e.g. PENDING directly to COMPLETED)", () => {
      expect(SampleStateMachine.canTransition("PENDING", "COMPLETED")).toBe(false);
      expect(SampleStateMachine.canTransition("PENDING", "PROCESSING")).toBe(false);
      expect(SampleStateMachine.canTransition("COLLECTED", "COMPLETED")).toBe(false);

      let threw = false;
      try {
        SampleStateMachine.transition("PENDING", "COMPLETED");
      } catch (e: any) {
        threw = true;
        expect(e.message.includes("Illegal state transition")).toBe(true);
      }
      expect(threw).toBe(true);
    });

    it("should mandate rejection reasons when rejecting a biological specimen", () => {
      let threw = false;
      try {
        SampleStateMachine.transition("RECEIVED", "REJECTED", ""); // Missing reason
      } catch (e: any) {
        threw = true;
        expect(e.message.includes("rejection reason")).toBe(true);
      }
      expect(threw).toBe(true);

      const rejectedState = SampleStateMachine.transition(
        "RECEIVED",
        "REJECTED",
        "Grossly Hemolyzed specimen - recollection required"
      );
      expect(rejectedState).toBe("REJECTED");
    });

    it("should map clinical diagnostic tests to standardized CLSI vacutainer container types", () => {
      const getContainerForTest = (testCode: string): { tubeColor: string; container: string } => {
        const code = testCode.toUpperCase();
        if (code.includes("CBC") || code.includes("ESR") || code.includes("HBA1C")) {
          return { tubeColor: "LAVENDER", container: "K2_EDTA_WHOLE_BLOOD" };
        }
        if (code.includes("PT") || code.includes("INR") || code.includes("D_DIMER")) {
          return { tubeColor: "LIGHT_BLUE", container: "SODIUM_CITRATE_3_2" };
        }
        if (code.includes("GLUCOSE") || code.includes("FBS") || code.includes("PPBS")) {
          return { tubeColor: "GREY", container: "SODIUM_FLUORIDE_POTASSIUM_OXALATE" };
        }
        return { tubeColor: "GOLD_YELLOW", container: "SST_SERUM_SEPARATING_GEL" };
      };

      const cbc = getContainerForTest("CBC-AUTOMATED");
      expect(cbc.tubeColor).toBe("LAVENDER");
      expect(cbc.container).toBe("K2_EDTA_WHOLE_BLOOD");

      const inr = getContainerForTest("PT-INR");
      expect(inr.tubeColor).toBe("LIGHT_BLUE");
      expect(inr.container).toBe("SODIUM_CITRATE_3_2");

      const glucose = getContainerForTest("FASTING-GLUCOSE");
      expect(glucose.tubeColor).toBe("GREY");

      const lft = getContainerForTest("LIVER-FUNCTION-TEST");
      expect(lft.tubeColor).toBe("GOLD_YELLOW");
    });
  });
}
