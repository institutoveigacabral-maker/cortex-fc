import { describe, it, expect } from "vitest";
import { calculateSynergyIndex } from "@/lib/squad-synergy";

describe("calculateSynergyIndex", () => {
  const baseSquad = [
    { name: "Player A", position: "CB", scnPlus: 70, age: 27, vx: 1.5, rx: 1.0 },
    { name: "Player B", position: "CB", scnPlus: 65, age: 25, vx: 1.3, rx: 0.9 },
    { name: "Player C", position: "ST", scnPlus: 80, age: 28, vx: 2.0, rx: 0.7 },
    { name: "Player D", position: "AM", scnPlus: 75, age: 23, vx: 1.8, rx: 1.2 },
    { name: "Player E", position: "GK", scnPlus: 60, age: 30, vx: 1.0, rx: 0.5 },
  ];

  it("returns high positionNeed for uncovered position", () => {
    const newPlayer = { name: "New CM", position: "CM", scnPlus: 72, age: 24, vx: 1.5, rx: 1.0 };
    const result = calculateSynergyIndex(newPlayer, baseSquad);
    expect(result.positionNeed).toBe(95);
    expect(result.reasoning).toContainEqual(expect.stringContaining("sem cobertura"));
  });

  it("returns moderate positionNeed for position with 2 players", () => {
    const newCB = { name: "New CB", position: "CB", scnPlus: 75, age: 26, vx: 1.5, rx: 1.0 };
    const result = calculateSynergyIndex(newCB, baseSquad);
    expect(result.positionNeed).toBe(50);
    expect(result.reasoning).toContainEqual(expect.stringContaining("reforco moderado"));
  });

  it("calculates positive qualityDelta when player is above average", () => {
    const betterCB = { name: "Better CB", position: "CB", scnPlus: 85, age: 26, vx: 1.5, rx: 1.0 };
    const result = calculateSynergyIndex(betterCB, baseSquad);
    // CB avg = (70+65)/2 = 67.5, delta = 85-67.5 = 17.5
    expect(result.qualityDelta).toBeGreaterThan(10);
    expect(result.reasoning).toContainEqual(expect.stringContaining("significativamente acima"));
  });

  it("calculates negative qualityDelta when player is below average", () => {
    const weakCB = { name: "Weak CB", position: "CB", scnPlus: 55, age: 26, vx: 1.5, rx: 1.0 };
    const result = calculateSynergyIndex(weakCB, baseSquad);
    expect(result.qualityDelta).toBeLessThan(0);
    expect(result.reasoning).toContainEqual(expect.stringContaining("abaixo da media"));
  });

  it("uses 50 as baseline SCN when no existing player at position", () => {
    const newCM = { name: "CM Player", position: "CM", scnPlus: 60, age: 25, vx: 1.5, rx: 1.0 };
    const result = calculateSynergyIndex(newCM, baseSquad);
    // No CM in squad -> avg = 50, delta = 60-50 = 10
    expect(result.qualityDelta).toBe(10);
  });

  it("evaluates age balance impact", () => {
    const result = calculateSynergyIndex(
      { name: "Young Player", position: "CM", scnPlus: 70, age: 20, vx: 1.5, rx: 1.0 },
      baseSquad
    );
    expect(result.ageBalance).toBeGreaterThanOrEqual(0);
    expect(result.ageBalance).toBeLessThanOrEqual(100);
    expect(result.reasoning).toContainEqual(expect.stringContaining("jovem"));
  });

  it("categorizes players by age in reasoning", () => {
    const prime = calculateSynergyIndex(
      { name: "Prime", position: "CM", scnPlus: 70, age: 27, vx: 1.5, rx: 1.0 },
      baseSquad
    );
    expect(prime.reasoning).toContainEqual(expect.stringContaining("pico"));

    const senior = calculateSynergyIndex(
      { name: "Senior", position: "CM", scnPlus: 70, age: 32, vx: 1.5, rx: 1.0 },
      baseSquad
    );
    expect(senior.reasoning).toContainEqual(expect.stringContaining("experiente"));
  });

  it("calculates complementarity based on Vx/Rx diversity", () => {
    // Squad averages: vx = (1.5+1.3+2.0+1.8+1.0)/5 = 1.52, rx = (1.0+0.9+0.7+1.2+0.5)/5 = 0.86
    // complementarity = min(100, 50 + (vxDiv + rxDiv) * 2)
    // For diverse player: vxDiv = |3.0-1.52| = 1.48, rxDiv = |2.5-0.86| = 1.64
    // complementarity = min(100, 50 + (1.48+1.64)*2) = min(100, 50+6.24) = 56
    const diversePlayer = { name: "Diverse", position: "CM", scnPlus: 70, age: 25, vx: 3.0, rx: 2.5 };
    const result = calculateSynergyIndex(diversePlayer, baseSquad);
    expect(result.complementarity).toBeGreaterThan(50);

    // A similar player should get lower complementarity
    const similarPlayer = { name: "Similar", position: "CM", scnPlus: 70, age: 25, vx: 1.5, rx: 0.9 };
    const similar = calculateSynergyIndex(similarPlayer, baseSquad);
    expect(result.complementarity).toBeGreaterThan(similar.complementarity);
  });

  it("overallFit is between 0 and 100", () => {
    const newPlayer = { name: "Test", position: "CM", scnPlus: 70, age: 25, vx: 1.5, rx: 1.0 };
    const result = calculateSynergyIndex(newPlayer, baseSquad);
    expect(result.overallFit).toBeGreaterThanOrEqual(0);
    expect(result.overallFit).toBeLessThanOrEqual(100);
  });

  it("handles empty squad", () => {
    const player = { name: "First", position: "ST", scnPlus: 70, age: 25, vx: 1.5, rx: 1.0 };
    const result = calculateSynergyIndex(player, []);
    expect(result.positionNeed).toBe(95);
    expect(result.qualityDelta).toBe(20); // 70 - 50 (default)
    expect(result.overallFit).toBeGreaterThan(0);
  });
});
