import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/agents/base-agent", () => ({
  callAgent: vi.fn(),
}));

import { runCfo } from "@/lib/agents/cfo-agent";
import { callAgent } from "@/lib/agents/base-agent";

const mockCallAgent = vi.mocked(callAgent);

describe("runCfo", () => {
  beforeEach(() => {
    mockCallAgent.mockReset();
  });

  const mockCfoOutput = {
    fairValue: 25,
    roiProjection: 35,
    amortizationPerYear: 5,
    totalCostOverContract: 50,
    salaryAsPercentOfRevenue: 8,
    recommendation: "NEGOTIATE" as const,
    reasoning: "O valor pedido esta acima do justo...",
  };

  it("calls callAgent with CFO_MODELER type", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockCfoOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 900,
      model: "claude-sonnet-4-20250514",
    });

    await runCfo({
      playerId: "p1",
      proposedFee: 20,
      proposedSalary: 5,
      contractYears: 4,
      sellingClubAsk: 30,
    });

    expect(mockCallAgent).toHaveBeenCalledWith(
      expect.objectContaining({ agentType: "CFO_MODELER" })
    );
  });

  it("builds user message with financial calculations", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockCfoOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 900,
      model: "claude-sonnet-4-20250514",
    });

    await runCfo({
      playerId: "p1",
      proposedFee: 20,
      proposedSalary: 5,
      contractYears: 4,
      sellingClubAsk: 30,
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).toContain("€20M"); // proposed fee
    expect(msg).toContain("€5M"); // salary
    expect(msg).toContain("4 anos"); // contract
    expect(msg).toContain("€30M"); // asking price
    // Gap analysis: 30-20 = 10M
    expect(msg).toContain("€10M");
    // Total cost min: 20 + 5*4 = 40
    expect(msg).toContain("€40M");
    // Amortization: 20/4 = 5
    expect(msg).toContain("5.00");
  });

  it("does not include gap section when proposed >= asking", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockCfoOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 900,
      model: "claude-sonnet-4-20250514",
    });

    await runCfo({
      playerId: "p1",
      proposedFee: 35,
      proposedSalary: 5,
      contractYears: 4,
      sellingClubAsk: 30,
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).not.toContain("Gap de negociação");
  });

  it("returns CFO recommendation", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockCfoOutput,
      reasoning: "test",
      tokensUsed: 400,
      inputTokens: 150,
      outputTokens: 250,
      costUsd: 0.004,
      durationMs: 900,
      model: "claude-sonnet-4-20250514",
    });

    const result = await runCfo({
      playerId: "p1",
      proposedFee: 20,
      proposedSalary: 5,
      contractYears: 4,
      sellingClubAsk: 30,
    });

    expect(result.data.recommendation).toBe("NEGOTIATE");
    expect(result.data.fairValue).toBe(25);
    expect(result.tokensUsed).toBe(400);
  });
});
