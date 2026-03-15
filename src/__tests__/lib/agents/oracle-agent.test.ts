import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock callAgent
vi.mock("@/lib/agents/base-agent", () => ({
  callAgent: vi.fn(),
}));

import { runOracle } from "@/lib/agents/oracle-agent";
import { callAgent } from "@/lib/agents/base-agent";

const mockCallAgent = vi.mocked(callAgent);

describe("runOracle", () => {
  beforeEach(() => {
    mockCallAgent.mockReset();
  });

  const mockOracleOutput = {
    vx: 1.8,
    rx: 0.7,
    decision: "CONTRATAR" as const,
    confidence: 85,
    reasoning: "Jogador de alto valor com baixo risco",
    layers: {
      C1_technical: 82,
      C2_tactical: 75,
      C3_physical: 70,
      C4_behavioral: 80,
      C5_narrative: 65,
      C6_economic: 78,
      C7_ai: 77,
    },
    algorithms: {
      AST: 78,
      CLF: 72,
      GNE: 80,
      WSE: 75,
      RBL: 68,
      SACE: 74,
      SCN_plus: 75,
    },
    recommendedActions: ["Iniciar negociacao"],
    risks: ["Adaptacao cultural"],
    comparables: ["Transfer similar: Player X -> Club Y"],
  };

  it("calls callAgent with ORACLE type and correct model", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOracleOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    await runOracle({
      playerId: "player-1",
      clubContextId: "club-1",
      vxComponents: { technical: 8 },
      rxComponents: { tacticalGap: 7 },
    });

    expect(mockCallAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agentType: "ORACLE",
        model: "claude-sonnet-4-20250514",
        maxTokens: 4096,
      })
    );
  });

  it("returns the data from callAgent result", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOracleOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    const result = await runOracle({
      playerId: "player-1",
      clubContextId: "club-1",
      vxComponents: {},
      rxComponents: {},
    });

    expect(result.decision).toBe("CONTRATAR");
    expect(result.vx).toBe(1.8);
    expect(result.rx).toBe(0.7);
    expect(result.confidence).toBe(85);
  });

  it("includes player and club context in user message", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOracleOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    await runOracle({
      playerId: "player-abc",
      clubContextId: "club-xyz",
      vxComponents: { technical: 9 },
      rxComponents: { tacticalGap: 8 },
      additionalContext: "Jogador esta em otima fase",
    });

    const call = mockCallAgent.mock.calls[0][0];
    expect(call.userMessage).toContain("player-abc");
    expect(call.userMessage).toContain("club-xyz");
    expect(call.userMessage).toContain("Jogador esta em otima fase");
    expect(call.userMessage).toContain('"technical": 9');
  });

  it("includes system prompt with ORACLE methodology", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOracleOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    await runOracle({
      playerId: "p1",
      clubContextId: "c1",
      vxComponents: {},
      rxComponents: {},
    });

    const call = mockCallAgent.mock.calls[0][0];
    expect(call.systemPrompt).toContain("CORTEX_FC_ORACLE");
    expect(call.systemPrompt).toContain("CONTRATAR");
    expect(call.systemPrompt).toContain("BLINDAR");
    expect(call.systemPrompt).toContain("Moneyball");
  });
});
