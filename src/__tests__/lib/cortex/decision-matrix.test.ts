import { describe, it, expect } from "vitest";
import {
  resolveDecision,
  adjustForConfidence,
  type DecisionInput,
  type DecisionOutput,
} from "@/lib/cortex/decision-matrix";

describe("resolveDecision", () => {
  // BLINDAR tests (current squad player)
  describe("current squad player (BLINDAR logic)", () => {
    it("returns BLINDAR for high-Vx squad player", () => {
      const result = resolveDecision({
        vx: 2.0,
        rx: 1.0,
        isCurrentSquadPlayer: true,
        confidence: 80,
      });
      expect(result.decision).toBe("BLINDAR");
      expect(result.actionPriority).toBe("URGENT");
      expect(result.suggestedDeadline).toBe("Immediate");
    });

    it("returns MONITORAR for fair-Vx squad player", () => {
      const result = resolveDecision({
        vx: 1.3,
        rx: 0.5,
        isCurrentSquadPlayer: true,
        confidence: 80,
      });
      expect(result.decision).toBe("MONITORAR");
      expect(result.actionPriority).toBe("MEDIUM");
    });

    it("returns EMPRESTIMO for low-Vx squad player", () => {
      const result = resolveDecision({
        vx: 0.7,
        rx: 0.5,
        isCurrentSquadPlayer: true,
        confidence: 80,
      });
      expect(result.decision).toBe("EMPRESTIMO");
      expect(result.actionPriority).toBe("LOW");
      expect(result.suggestedDeadline).toBe("Next window");
    });
  });

  // External targets: Vx > 1.5 row
  describe("external target, high Vx (>1.5)", () => {
    it("CONTRATAR URGENT when Rx < 0.8", () => {
      const result = resolveDecision({
        vx: 2.0,
        rx: 0.5,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("CONTRATAR");
      expect(result.actionPriority).toBe("URGENT");
      expect(result.suggestedDeadline).toBe("Immediate");
    });

    it("CONTRATAR HIGH when Rx 0.8-1.5", () => {
      const result = resolveDecision({
        vx: 2.0,
        rx: 1.2,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("CONTRATAR");
      expect(result.actionPriority).toBe("HIGH");
    });

    it("ALERTA_CINZA when Rx > 1.5", () => {
      const result = resolveDecision({
        vx: 2.0,
        rx: 2.0,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("ALERTA_CINZA");
      expect(result.actionPriority).toBe("HIGH");
    });
  });

  // External targets: Vx 1.0-1.5 row
  describe("external target, fair Vx (1.0-1.5)", () => {
    it("MONITORAR when Rx <= 1.5", () => {
      const result = resolveDecision({
        vx: 1.2,
        rx: 1.0,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("MONITORAR");
      expect(result.actionPriority).toBe("MEDIUM");
    });

    it("RECUSAR when Rx > 1.5", () => {
      const result = resolveDecision({
        vx: 1.2,
        rx: 2.0,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("RECUSAR");
      expect(result.actionPriority).toBe("LOW");
    });
  });

  // External targets: Vx < 1.0 row
  describe("external target, low Vx (<1.0)", () => {
    it("EMPRESTIMO when Rx < 0.8", () => {
      const result = resolveDecision({
        vx: 0.5,
        rx: 0.5,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("EMPRESTIMO");
      expect(result.actionPriority).toBe("LOW");
    });

    it("RECUSAR when Rx >= 0.8", () => {
      const result = resolveDecision({
        vx: 0.5,
        rx: 1.0,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("RECUSAR");
      expect(result.actionPriority).toBe("LOW");
    });
  });

  // Boundary conditions
  describe("boundary conditions", () => {
    it("Vx exactly 1.5 is NOT high (falls into fair range)", () => {
      const result = resolveDecision({
        vx: 1.5,
        rx: 0.5,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("MONITORAR");
    });

    it("Vx exactly 1.0 is fair, not low", () => {
      const result = resolveDecision({
        vx: 1.0,
        rx: 0.5,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("MONITORAR");
    });

    it("Rx exactly 0.8 falls into moderate range", () => {
      const result = resolveDecision({
        vx: 2.0,
        rx: 0.8,
        isCurrentSquadPlayer: false,
        confidence: 80,
      });
      expect(result.decision).toBe("CONTRATAR");
      expect(result.actionPriority).toBe("HIGH");
    });
  });

  it("includes Vx and Rx values in reasoning", () => {
    const result = resolveDecision({
      vx: 2.0,
      rx: 0.5,
      isCurrentSquadPlayer: false,
      confidence: 80,
    });
    expect(result.reasoning).toContain("2");
    expect(result.reasoning).toContain("0.5");
  });
});

describe("adjustForConfidence", () => {
  const urgentDecision: DecisionOutput = {
    decision: "CONTRATAR",
    reasoning: "Test reasoning",
    actionPriority: "URGENT",
    suggestedDeadline: "Immediate",
  };

  it("returns decision unchanged when confidence >= 75", () => {
    const result = adjustForConfidence(urgentDecision, 80);
    expect(result).toEqual(urgentDecision);
  });

  it("returns decision unchanged at exactly 75", () => {
    const result = adjustForConfidence(urgentDecision, 75);
    expect(result).toEqual(urgentDecision);
  });

  it("downgrades priority when confidence 50-74", () => {
    const result = adjustForConfidence(urgentDecision, 60);
    expect(result.decision).toBe("CONTRATAR"); // Decision preserved
    expect(result.actionPriority).toBe("HIGH"); // URGENT -> HIGH
    expect(result.reasoning).toContain("Confiança 60%");
  });

  it("downgrades HIGH to MEDIUM when confidence 50-74", () => {
    const highDecision: DecisionOutput = {
      ...urgentDecision,
      actionPriority: "HIGH",
    };
    const result = adjustForConfidence(highDecision, 60);
    expect(result.actionPriority).toBe("MEDIUM");
  });

  it("keeps MEDIUM as MEDIUM when confidence 50-74", () => {
    const mediumDecision: DecisionOutput = {
      ...urgentDecision,
      actionPriority: "MEDIUM",
    };
    const result = adjustForConfidence(mediumDecision, 60);
    expect(result.actionPriority).toBe("MEDIUM");
  });

  it("overrides to MONITORAR when confidence < 50", () => {
    const result = adjustForConfidence(urgentDecision, 30);
    expect(result.decision).toBe("MONITORAR");
    expect(result.actionPriority).toBe("LOW");
    expect(result.suggestedDeadline).toBe("Pending more data");
    expect(result.reasoning).toContain("Confiança 30%");
    expect(result.reasoning).toContain("CONTRATAR"); // Original preserved in text
  });
});
