import { describe, it, expect } from "vitest";
import { CACHE_KEYS, TTL } from "@/lib/cache";

describe("CACHE_KEYS", () => {
  it("generates dashboard stats key with orgId", () => {
    expect(CACHE_KEYS.dashboardStats("org123")).toBe("dashboard:stats:org123");
  });

  it("generates player list key with orgId and page", () => {
    expect(CACHE_KEYS.playerList("org123", 2)).toBe("players:list:org123:2");
  });

  it("generates analysis detail key", () => {
    expect(CACHE_KEYS.analysisDetail("a456")).toBe("analysis:a456");
  });

  it("generates agent metrics key", () => {
    expect(CACHE_KEYS.agentMetrics("org789")).toBe("agent:metrics:org789");
  });

  it("generates scouting targets key", () => {
    expect(CACHE_KEYS.scoutingTargets("org123")).toBe("scouting:targets:org123");
  });
});

describe("TTL", () => {
  it("has correct durations in seconds", () => {
    expect(TTL.SHORT).toBe(60);
    expect(TTL.MEDIUM).toBe(300);
    expect(TTL.LONG).toBe(900);
    expect(TTL.HOUR).toBe(3600);
    expect(TTL.DAY).toBe(86400);
  });
});
