import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/agents/base-agent", () => ({
  callAgent: vi.fn(),
}));

import { runScout } from "@/lib/agents/scout-agent";
import { callAgent } from "@/lib/agents/base-agent";

const mockCallAgent = vi.mocked(callAgent);

describe("runScout", () => {
  beforeEach(() => {
    mockCallAgent.mockReset();
  });

  const mockScoutOutput = {
    candidates: [
      {
        name: "Test Player",
        age: 24,
        club: "FC Test",
        marketValue: 15,
        fitScore: 88,
        strengths: ["Ball progression"],
        risks: ["Injury history"],
      },
    ],
    reasoning: "Based on criteria analysis...",
  };

  it("calls callAgent with SCOUT type", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockScoutOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 800,
      model: "claude-sonnet-4-20250514",
    });

    await runScout({
      position: "CB",
      ageRange: [22, 28],
      budgetMax: 30,
      style: "ball-playing CB",
    });

    expect(mockCallAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agentType: "SCOUT",
      })
    );
  });

  it("includes search criteria in user message", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockScoutOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 800,
      model: "claude-sonnet-4-20250514",
    });

    await runScout({
      position: "ST",
      ageRange: [20, 25],
      budgetMax: 50,
      style: "pressing forward",
      leaguePreference: ["Premier League", "Bundesliga"],
      mustHaveTraits: ["pace", "aerial"],
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).toContain("ST");
    expect(msg).toContain("20-25");
    expect(msg).toContain("50");
    expect(msg).toContain("pressing forward");
    expect(msg).toContain("Premier League");
    expect(msg).toContain("Bundesliga");
    expect(msg).toContain("pace");
    expect(msg).toContain("aerial");
  });

  it("handles optional fields being undefined", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockScoutOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 800,
      model: "claude-sonnet-4-20250514",
    });

    await runScout({
      position: "AM",
      ageRange: [18, 22],
      budgetMax: 10,
      style: "creative playmaker",
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).toContain("AM");
    expect(msg).not.toContain("Ligas de preferência");
    expect(msg).not.toContain("Traços obrigatórios");
  });

  it("returns candidates from agent response", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockScoutOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 800,
      model: "claude-sonnet-4-20250514",
    });

    const result = await runScout({
      position: "CB",
      ageRange: [22, 28],
      budgetMax: 30,
      style: "ball-playing CB",
    });

    expect(result.data.candidates).toHaveLength(1);
    expect(result.data.candidates[0].fitScore).toBe(88);
    expect(result.data.reasoning).toContain("Based on criteria");
    expect(result.tokensUsed).toBe(400);
  });
});
