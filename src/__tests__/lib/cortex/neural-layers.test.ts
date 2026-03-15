import { describe, it, expect } from "vitest";
import {
  calculateComposite,
  calculateAlgorithms,
  POSITION_WEIGHTS,
} from "@/lib/cortex/neural-layers";
import type { NeuralLayers } from "@/types/cortex";

const sampleLayers: NeuralLayers = {
  C1_technical: 80,
  C2_tactical: 70,
  C3_physical: 60,
  C4_behavioral: 75,
  C5_narrative: 50,
  C6_economic: 65,
  C7_ai: 72,
};

describe("calculateComposite", () => {
  it("calculates weighted average with default weights", () => {
    const result = calculateComposite(sampleLayers);
    // All default weights sum to 1.0
    // 80*0.20 + 70*0.18 + 60*0.12 + 75*0.15 + 50*0.08 + 65*0.15 + 72*0.12
    // = 16 + 12.6 + 7.2 + 11.25 + 4 + 9.75 + 8.64 = 69.44
    expect(result).toBe(69.44);
  });

  it("applies custom weights and normalizes them", () => {
    const customWeights = {
      C1_technical: 0.5,
      C2_tactical: 0.5,
      C3_physical: 0,
      C4_behavioral: 0,
      C5_narrative: 0,
      C6_economic: 0,
      C7_ai: 0,
    };
    const result = calculateComposite(sampleLayers, customWeights);
    // Normalized: each 0.5/1.0 = 0.5
    // 80*0.5 + 70*0.5 = 75
    expect(result).toBe(75);
  });

  it("handles uniform layers producing a simple average", () => {
    const uniform: NeuralLayers = {
      C1_technical: 50,
      C2_tactical: 50,
      C3_physical: 50,
      C4_behavioral: 50,
      C5_narrative: 50,
      C6_economic: 50,
      C7_ai: 50,
    };
    const result = calculateComposite(uniform);
    expect(result).toBe(50);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateComposite({
      C1_technical: 33,
      C2_tactical: 33,
      C3_physical: 33,
      C4_behavioral: 33,
      C5_narrative: 33,
      C6_economic: 33,
      C7_ai: 33,
    });
    expect(result).toBe(33);
  });
});

describe("calculateAlgorithms", () => {
  const context = {
    squadNeed: 80,
    culturalMatch: 70,
    systemFit: 75,
  };

  it("returns all 7 algorithm scores", () => {
    const result = calculateAlgorithms(sampleLayers, context);
    expect(result).toHaveProperty("AST");
    expect(result).toHaveProperty("CLF");
    expect(result).toHaveProperty("GNE");
    expect(result).toHaveProperty("WSE");
    expect(result).toHaveProperty("RBL");
    expect(result).toHaveProperty("SACE");
    expect(result).toHaveProperty("SCN_plus");
  });

  it("calculates AST (Tactical Synergy) correctly", () => {
    const result = calculateAlgorithms(sampleLayers, context);
    // AST = C2*0.35 + systemFit*0.35 + C1*0.15 + C3*0.15
    // = 70*0.35 + 75*0.35 + 80*0.15 + 60*0.15
    // = 24.5 + 26.25 + 12 + 9 = 71.75 -> 72
    expect(result.AST).toBe(72);
  });

  it("calculates CLF (Cultural Fit) correctly", () => {
    const result = calculateAlgorithms(sampleLayers, context);
    // CLF = culturalMatch*0.5 + C4*0.3 + C5*0.2
    // = 70*0.5 + 75*0.3 + 50*0.2 = 35 + 22.5 + 10 = 67.5 -> 68
    expect(result.CLF).toBe(68);
  });

  it("calculates GNE (Strategic Need) correctly", () => {
    const result = calculateAlgorithms(sampleLayers, context);
    // GNE = squadNeed*0.5 + C2*0.2 + C6*0.15 + C3*0.15
    // = 80*0.5 + 70*0.2 + 65*0.15 + 60*0.15 = 40 + 14 + 9.75 + 9 = 72.75 -> 73
    expect(result.GNE).toBe(73);
  });

  it("calculates SCN+ as average of the 6 sub-algorithms", () => {
    const result = calculateAlgorithms(sampleLayers, context);
    const avgOf6 = Math.round(
      (result.AST + result.CLF + result.GNE + result.WSE + result.RBL + result.SACE) / 6
    );
    expect(result.SCN_plus).toBe(avgOf6);
  });

  it("clamps all values to 0-100", () => {
    const extreme: NeuralLayers = {
      C1_technical: 100,
      C2_tactical: 100,
      C3_physical: 100,
      C4_behavioral: 100,
      C5_narrative: 100,
      C6_economic: 100,
      C7_ai: 100,
    };
    const maxContext = { squadNeed: 100, culturalMatch: 100, systemFit: 100 };
    const result = calculateAlgorithms(extreme, maxContext);
    expect(result.AST).toBeLessThanOrEqual(100);
    expect(result.CLF).toBeLessThanOrEqual(100);
    expect(result.SCN_plus).toBeLessThanOrEqual(100);
  });

  it("handles zero inputs", () => {
    const zero: NeuralLayers = {
      C1_technical: 0,
      C2_tactical: 0,
      C3_physical: 0,
      C4_behavioral: 0,
      C5_narrative: 0,
      C6_economic: 0,
      C7_ai: 0,
    };
    const zeroCtx = { squadNeed: 0, culturalMatch: 0, systemFit: 0 };
    const result = calculateAlgorithms(zero, zeroCtx);
    expect(result.AST).toBe(0);
    expect(result.CLF).toBe(0);
    // RBL uses (100 - C4) so it won't be 0
    expect(result.RBL).toBe(25); // (100-0)*0.25 = 25
  });
});

describe("POSITION_WEIGHTS", () => {
  it("has weights for GK, CB, ST, AM", () => {
    expect(POSITION_WEIGHTS.GK).toBeDefined();
    expect(POSITION_WEIGHTS.CB).toBeDefined();
    expect(POSITION_WEIGHTS.ST).toBeDefined();
    expect(POSITION_WEIGHTS.AM).toBeDefined();
  });

  it("GK weights sum to 1.0", () => {
    const sum = Object.values(POSITION_WEIGHTS.GK!).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("ST has highest C1_technical weight", () => {
    const stWeights = POSITION_WEIGHTS.ST!;
    const maxKey = Object.entries(stWeights).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    expect(maxKey).toBe("C1_technical");
  });

  it("CB has highest C2_tactical weight", () => {
    const cbWeights = POSITION_WEIGHTS.CB!;
    const maxKey = Object.entries(cbWeights).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    expect(maxKey).toBe("C2_tactical");
  });
});
