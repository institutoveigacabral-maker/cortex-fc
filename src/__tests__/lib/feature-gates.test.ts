import { describe, it, expect } from "vitest";
import {
  getTierLimits,
  canUseFeature,
  canUseAgent,
  checkUsageLimit,
  requiredTierFor,
  isTierAtLeast,
  TIER_NAMES,
} from "@/lib/feature-gates";

describe("getTierLimits", () => {
  it("returns free tier limits for unknown tier", () => {
    const limits = getTierLimits("nonexistent");
    expect(limits.analysesPerMonth).toBe(5);
    expect(limits.usersPerOrg).toBe(1);
  });

  it("returns correct free tier limits", () => {
    const limits = getTierLimits("free");
    expect(limits.analysesPerMonth).toBe(5);
    expect(limits.agents).toEqual(["ORACLE"]);
    expect(limits.apiAccess).toBe(false);
    expect(limits.exportFormats).toEqual([]);
  });

  it("returns unlimited analyses for club_professional", () => {
    const limits = getTierLimits("club_professional");
    expect(limits.analysesPerMonth).toBe(-1);
    expect(limits.apiAccess).toBe(true);
    expect(limits.agents).toHaveLength(6);
  });

  it("holding_multiclub has whiteLabel and SSO", () => {
    const limits = getTierLimits("holding_multiclub");
    expect(limits.whiteLabel).toBe(true);
    expect(limits.sso).toBe(true);
    expect(limits.exportFormats).toContain("xlsx");
  });
});

describe("canUseFeature", () => {
  it("returns true for boolean features that are true", () => {
    expect(canUseFeature("club_professional", "apiAccess")).toBe(true);
  });

  it("returns false for boolean features that are false", () => {
    expect(canUseFeature("free", "apiAccess")).toBe(false);
  });

  it("returns true for non-zero numeric limits", () => {
    expect(canUseFeature("free", "analysesPerMonth")).toBe(true);
  });

  it("returns true for non-empty arrays", () => {
    expect(canUseFeature("free", "agents")).toBe(true);
  });

  it("returns false for empty arrays", () => {
    expect(canUseFeature("free", "exportFormats")).toBe(false);
  });
});

describe("canUseAgent", () => {
  it("free tier can only use ORACLE", () => {
    expect(canUseAgent("free", "ORACLE")).toBe(true);
    expect(canUseAgent("free", "SCOUT")).toBe(false);
    expect(canUseAgent("free", "ANALISTA")).toBe(false);
  });

  it("scout_individual can use ORACLE and SCOUT", () => {
    expect(canUseAgent("scout_individual", "ORACLE")).toBe(true);
    expect(canUseAgent("scout_individual", "SCOUT")).toBe(true);
    expect(canUseAgent("scout_individual", "CFO_MODELER")).toBe(false);
  });

  it("club_professional can use all agents", () => {
    expect(canUseAgent("club_professional", "ORACLE")).toBe(true);
    expect(canUseAgent("club_professional", "ANALISTA")).toBe(true);
    expect(canUseAgent("club_professional", "CFO_MODELER")).toBe(true);
    expect(canUseAgent("club_professional", "BOARD_ADVISOR")).toBe(true);
    expect(canUseAgent("club_professional", "COACHING_ASSIST")).toBe(true);
  });
});

describe("checkUsageLimit", () => {
  it("allows usage below limit", () => {
    const result = checkUsageLimit("free", "analysesPerMonth", 3);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(5);
  });

  it("denies usage at limit", () => {
    const result = checkUsageLimit("free", "analysesPerMonth", 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("denies usage above limit", () => {
    const result = checkUsageLimit("free", "analysesPerMonth", 10);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("always allows for unlimited (-1) tiers", () => {
    const result = checkUsageLimit("club_professional", "analysesPerMonth", 999);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
    expect(result.limit).toBe(-1);
  });
});

describe("requiredTierFor", () => {
  it("returns club_professional for apiAccess", () => {
    expect(requiredTierFor("apiAccess")).toBe("club_professional");
  });

  it("returns holding_multiclub for whiteLabel", () => {
    expect(requiredTierFor("whiteLabel")).toBe("holding_multiclub");
  });

  it("returns club_professional for allAgents", () => {
    expect(requiredTierFor("allAgents")).toBe("club_professional");
  });

  it("returns club_professional for pdfExport", () => {
    expect(requiredTierFor("pdfExport")).toBe("club_professional");
  });

  it("returns holding_multiclub for unknown features", () => {
    expect(requiredTierFor("unknownFeature")).toBe("holding_multiclub");
  });
});

describe("isTierAtLeast", () => {
  it("free is at least free", () => {
    expect(isTierAtLeast("free", "free")).toBe(true);
  });

  it("free is NOT at least scout_individual", () => {
    expect(isTierAtLeast("free", "scout_individual")).toBe(false);
  });

  it("holding_multiclub is at least any tier", () => {
    expect(isTierAtLeast("holding_multiclub", "free")).toBe(true);
    expect(isTierAtLeast("holding_multiclub", "club_professional")).toBe(true);
  });

  it("unknown tier defaults to free level (0)", () => {
    expect(isTierAtLeast("unknown", "free")).toBe(true);
    expect(isTierAtLeast("unknown", "scout_individual")).toBe(false);
  });
});

describe("TIER_NAMES", () => {
  it("maps all 4 tiers to display names", () => {
    expect(TIER_NAMES.free).toBe("Free");
    expect(TIER_NAMES.scout_individual).toBe("Scout Individual");
    expect(TIER_NAMES.club_professional).toBe("Club Professional");
    expect(TIER_NAMES.holding_multiclub).toBe("Holding Multi-Club");
  });
});
