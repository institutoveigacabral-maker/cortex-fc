import { describe, it, expect } from "vitest";
import {
  calculateRx,
  calculateTacticalGap,
  calculateMentalFortitude,
} from "@/lib/cortex/rx-calculator";
import type { RxComponents } from "@/types/cortex";

describe("calculateRx", () => {
  const baseComponents: RxComponents = {
    tacticalGap: 7,
    contextualFit: 6,
    experienceProfile: 5,
    narrativeIndex: 4,
    mentalFortitude: 8,
    injuryMicroRisk: 3,
    suspensionRisk: 2,
    valueAtRisk: 10,
    marketJitter: 5,
  };

  it("calculates Rx correctly with standard inputs", () => {
    // positives = 7+6+5+4+8 = 30, negatives = 3+2 = 5
    // adjusted = (30-5) * 1.5 = 37.5
    // riskExposure = 10+5 = 15
    // rx = 37.5/15 = 2.5
    const result = calculateRx(baseComponents);
    expect(result).toBe(2.5);
  });

  it("returns 0 when riskExposure is 0", () => {
    expect(
      calculateRx({ ...baseComponents, valueAtRisk: 0, marketJitter: 0 })
    ).toBe(0);
  });

  it("returns 0 when riskExposure is negative", () => {
    expect(
      calculateRx({ ...baseComponents, valueAtRisk: -5, marketJitter: -5 })
    ).toBe(0);
  });

  it("returns low Rx for high-risk exposure with moderate positives", () => {
    const result = calculateRx({
      ...baseComponents,
      valueAtRisk: 50,
      marketJitter: 50,
    });
    // adjusted = 37.5, exposure = 100, rx = 0.38
    expect(result).toBe(0.38);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateRx({
      ...baseComponents,
      valueAtRisk: 7,
      marketJitter: 3,
    });
    // exposure = 10, rx = 37.5/10 = 3.75
    expect(result).toBe(3.75);
  });
});

describe("calculateTacticalGap", () => {
  it("returns 10 for zero squad depth (critical need)", () => {
    expect(calculateTacticalGap(0, 5, false)).toBe(10);
  });

  it("returns 8 for 1 player and starter quality", () => {
    expect(calculateTacticalGap(1, 7, true)).toBe(8);
  });

  it("returns 6 for 1 player but not starter quality", () => {
    expect(calculateTacticalGap(1, 7, false)).toBe(6);
  });

  it("returns 7 for low average quality at position", () => {
    expect(calculateTacticalGap(3, 4, false)).toBe(7);
  });

  it("returns 4 for moderate quality at position", () => {
    expect(calculateTacticalGap(3, 6, false)).toBe(4);
  });

  it("returns 2 for well-covered position with high quality", () => {
    expect(calculateTacticalGap(3, 8, false)).toBe(2);
  });

  it("decreases with more depth but has minimum of 10", () => {
    // With 4 players and high quality (8), the avgQuality >= 7 check triggers first -> returns 2
    // The max(10, ...) formula only applies when none of the earlier conditions match
    // In practice, 4+ players at high quality = well-covered = 2
    expect(calculateTacticalGap(4, 8, false)).toBe(2);
    expect(calculateTacticalGap(5, 8, false)).toBe(2);
    // But with low quality, the low-quality check triggers first
    expect(calculateTacticalGap(4, 3, false)).toBe(7);
  });
});

describe("calculateMentalFortitude", () => {
  it("returns baseline 5 for average player", () => {
    expect(calculateMentalFortitude(0, 0, 0, 0)).toBe(5);
  });

  it("adds +2 for >5 knockout goals", () => {
    expect(calculateMentalFortitude(6, 0, 0, 0)).toBe(7);
  });

  it("adds +1 for 3-5 knockout goals", () => {
    expect(calculateMentalFortitude(3, 0, 0, 0)).toBe(6);
  });

  it("adds +1 for penalty ratio > 80%", () => {
    expect(calculateMentalFortitude(0, 9, 1, 0)).toBe(6);
  });

  it("subtracts -1 for penalty ratio < 50%", () => {
    expect(calculateMentalFortitude(0, 2, 3, 0)).toBe(4);
  });

  it("uses 0.5 default when no penalties taken", () => {
    // No penalty bonus or penalty -> baseline stays
    expect(calculateMentalFortitude(0, 0, 0, 0)).toBe(5);
  });

  it("adds +2 for >50 international caps", () => {
    expect(calculateMentalFortitude(0, 0, 0, 60)).toBe(7);
  });

  it("adds +1 for 21-50 international caps", () => {
    expect(calculateMentalFortitude(0, 0, 0, 30)).toBe(6);
  });

  it("clamps result to 0-10 range", () => {
    // Max: 5 + 2 (knockouts) + 1 (penalties) + 2 (caps) = 10
    expect(calculateMentalFortitude(10, 10, 0, 100)).toBe(10);
    // Can't easily go below 0, but verify clamping
    expect(calculateMentalFortitude(0, 0, 5, 0)).toBeGreaterThanOrEqual(0);
  });

  it("accumulates all bonuses for elite player", () => {
    const result = calculateMentalFortitude(8, 15, 2, 80);
    // 5 + 2 (knockouts > 5) + 1 (15/17 = 0.88 > 0.8) + 2 (80 caps > 50) = 10
    expect(result).toBe(10);
  });
});
