import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/agents/base-agent", () => ({
  callAgent: vi.fn(),
}));

import { runBoardAdvisor } from "@/lib/agents/board-advisor-agent";
import { callAgent } from "@/lib/agents/base-agent";

const mockCallAgent = vi.mocked(callAgent);

describe("runBoardAdvisor", () => {
  beforeEach(() => {
    mockCallAgent.mockReset();
  });

  const mockOutput = {
    executiveSummary: "Resumo executivo do planejamento...",
    windowStrategy: { priority: "BALANCED" as const, reasoning: "Equilibrio" },
    squadPriorities: [],
    financialOverview: {
      recommendedSpend: 50,
      recommendedSales: 20,
      netPosition: 30,
      ffpHeadroom: 40,
      wageImpact: 10,
    },
    riskAssessment: [],
    actionPlan: [],
    reasoning: "Analise completa...",
  };

  it("calls callAgent with BOARD_ADVISOR type", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOutput,
      reasoning: "test",
      tokensUsed: 600,
      durationMs: 1200,
      model: "claude-sonnet-4-20250514",
    });

    await runBoardAdvisor({
      clubName: "FC Test",
      currentBudget: 80,
      salaryCap: 120,
      strategicGoals: ["Top 4 finish", "Youth development"],
      currentSquadAssessment: "Strong defense, weak midfield",
      windowType: "summer",
      leagueContext: "Premier League",
    });

    expect(mockCallAgent).toHaveBeenCalledWith(
      expect.objectContaining({ agentType: "BOARD_ADVISOR" })
    );
  });

  it("includes all context in user message", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOutput,
      reasoning: "test",
      tokensUsed: 600,
      durationMs: 1200,
      model: "claude-sonnet-4-20250514",
    });

    await runBoardAdvisor({
      clubName: "Vasco da Gama",
      currentBudget: 30,
      salaryCap: 50,
      strategicGoals: ["Acesso Serie A", "Reducao de folha"],
      currentSquadAssessment: "Elenco envelhecido",
      windowType: "winter",
      leagueContext: "Serie B",
      existingTargets: ["Player X", "Player Y"],
      competitorsActivity: "Rival contratando muito",
      financialConstraints: "FFP limitado",
      additionalContext: "Base forte",
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).toContain("Vasco da Gama");
    expect(msg).toContain("Inverno");
    expect(msg).toContain("€30M");
    expect(msg).toContain("Acesso Serie A");
    expect(msg).toContain("Player X");
    expect(msg).toContain("Rival contratando");
    expect(msg).toContain("FFP limitado");
    expect(msg).toContain("Base forte");
  });

  it("omits optional sections when not provided", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOutput,
      reasoning: "test",
      tokensUsed: 600,
      durationMs: 1200,
      model: "claude-sonnet-4-20250514",
    });

    await runBoardAdvisor({
      clubName: "FC Minimal",
      currentBudget: 10,
      salaryCap: 20,
      strategicGoals: ["Survive"],
      currentSquadAssessment: "Thin squad",
      windowType: "summer",
      leagueContext: "League 1",
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).not.toContain("ALVOS JÁ IDENTIFICADOS");
    expect(msg).not.toContain("ATIVIDADE DOS CONCORRENTES");
  });
});
