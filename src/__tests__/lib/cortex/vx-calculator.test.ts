import { describe, it, expect } from "vitest";
import {
  calculateVx,
  calculateAgeDepreciation,
  calculateSalaryBurden,
  calculateInjuryRisk,
} from "@/lib/cortex/vx-calculator";
import type { VxComponents } from "@/types/cortex";

describe("calculateVx", () => {
  const baseComponents: VxComponents = {
    technical: 8,
    marketImpact: 7,
    culturalAdaptation: 6,
    networkingBenefit: 5,
    ageDepreciation: 3,
    liabilities: 2,
    regulatoryRisk: 1,
    totalCost: 50,
  };

  it("calculates Vx correctly with standard inputs", () => {
    // positives = 8+7+6+5 = 26, negatives = 3+2+1 = 6
    // rawValue = (26 - 6) * 2.5 = 50
    // vx = 50 / 50 = 1.0
    const result = calculateVx(baseComponents);
    expect(result).toBe(1);
  });

  it("returns 0 when totalCost is 0", () => {
    expect(calculateVx({ ...baseComponents, totalCost: 0 })).toBe(0);
  });

  it("returns 0 when totalCost is negative", () => {
    expect(calculateVx({ ...baseComponents, totalCost: -10 })).toBe(0);
  });

  it("returns high Vx for cheap, high-quality player", () => {
    const cheap: VxComponents = {
      technical: 9,
      marketImpact: 8,
      culturalAdaptation: 8,
      networkingBenefit: 7,
      ageDepreciation: 1,
      liabilities: 1,
      regulatoryRisk: 0,
      totalCost: 10,
    };
    // positives = 32, negatives = 2, raw = 30 * 2.5 = 75, vx = 75/10 = 7.5
    expect(calculateVx(cheap)).toBe(7.5);
  });

  it("returns low Vx for expensive, low-quality player", () => {
    const expensive: VxComponents = {
      technical: 3,
      marketImpact: 2,
      culturalAdaptation: 2,
      networkingBenefit: 1,
      ageDepreciation: 8,
      liabilities: 7,
      regulatoryRisk: 5,
      totalCost: 100,
    };
    // positives = 8, negatives = 20, raw = (8-20)*2.5 = -30, vx = -30/100 = -0.3
    expect(calculateVx(expensive)).toBe(-0.3);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateVx({
      ...baseComponents,
      totalCost: 33,
    });
    // rawValue = 50, 50/33 = 1.515151... -> 1.52
    expect(result).toBe(1.52);
  });
});

describe("calculateAgeDepreciation", () => {
  it("returns 1.0 for young players (<=23)", () => {
    expect(calculateAgeDepreciation(18)).toBe(1.0);
    expect(calculateAgeDepreciation(23)).toBe(1.0);
  });

  it("returns 1.5 for approaching peak (24-26)", () => {
    expect(calculateAgeDepreciation(24)).toBe(1.5);
    expect(calculateAgeDepreciation(26)).toBe(1.5);
  });

  it("returns 2.0 for peak (27-28)", () => {
    expect(calculateAgeDepreciation(27)).toBe(2.0);
    expect(calculateAgeDepreciation(28)).toBe(2.0);
  });

  it("returns 3.5 for starting decline (29-30)", () => {
    expect(calculateAgeDepreciation(29)).toBe(3.5);
    expect(calculateAgeDepreciation(30)).toBe(3.5);
  });

  it("returns 5.5 for significant depreciation (31-32)", () => {
    expect(calculateAgeDepreciation(31)).toBe(5.5);
    expect(calculateAgeDepreciation(32)).toBe(5.5);
  });

  it("returns 7.5 for ages 33-34", () => {
    expect(calculateAgeDepreciation(33)).toBe(7.5);
    expect(calculateAgeDepreciation(34)).toBe(7.5);
  });

  it("returns 9.0 for end-of-career players (35+)", () => {
    expect(calculateAgeDepreciation(35)).toBe(9.0);
    expect(calculateAgeDepreciation(40)).toBe(9.0);
  });
});

describe("calculateSalaryBurden", () => {
  it("returns 5 when wage budget is 0 or negative", () => {
    expect(calculateSalaryBurden(5, 0)).toBe(5);
    expect(calculateSalaryBurden(5, -10)).toBe(5);
  });

  it("returns 1 for salary < 3% of budget", () => {
    expect(calculateSalaryBurden(2, 100)).toBe(1);
  });

  it("returns 2 for salary 3-6% of budget", () => {
    expect(calculateSalaryBurden(4, 100)).toBe(2);
  });

  it("returns 4 for salary 6-10% of budget", () => {
    expect(calculateSalaryBurden(8, 100)).toBe(4);
  });

  it("returns 6 for salary 10-15% of budget", () => {
    expect(calculateSalaryBurden(12, 100)).toBe(6);
  });

  it("returns 8 for salary 15-20% of budget", () => {
    expect(calculateSalaryBurden(18, 100)).toBe(8);
  });

  it("returns 10 for salary >= 20% of budget", () => {
    expect(calculateSalaryBurden(25, 100)).toBe(10);
  });
});

describe("calculateInjuryRisk", () => {
  it("returns 1 for < 30 days missed", () => {
    expect(calculateInjuryRisk(10)).toBe(1);
  });

  it("returns 2 for 30-59 days missed", () => {
    expect(calculateInjuryRisk(45)).toBe(2);
  });

  it("returns 4 for 60-119 days missed", () => {
    expect(calculateInjuryRisk(90)).toBe(4);
  });

  it("returns 6 for 120-199 days missed", () => {
    expect(calculateInjuryRisk(150)).toBe(6);
  });

  it("returns 8 for 200-299 days missed", () => {
    expect(calculateInjuryRisk(250)).toBe(8);
  });

  it("returns 10 for >= 300 days missed", () => {
    expect(calculateInjuryRisk(350)).toBe(10);
  });
});
