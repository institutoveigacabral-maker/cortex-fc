import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/agents/base-agent", () => ({
  callAgent: vi.fn(),
}));

import { runCoachingAssist } from "@/lib/agents/coaching-assist-agent";
import { callAgent } from "@/lib/agents/base-agent";

const mockCallAgent = vi.mocked(callAgent);

describe("runCoachingAssist", () => {
  beforeEach(() => {
    mockCallAgent.mockReset();
  });

  const mockOutput = {
    developmentPlan: [
      {
        phase: "Fundamentos",
        duration: "4 semanas",
        objectives: ["Melhorar posicionamento"],
        drills: ["Rondos"],
        kpis: ["Passes completados"],
      },
    ],
    tacticalIntegration: {
      currentFit: 60,
      projectedFit: 85,
      keyAdaptations: ["Cobertura defensiva"],
      formationSuggestions: ["4-3-3"],
    },
    physicalPlan: {
      focus: ["Velocidade"],
      risks: ["Hamstring"],
      loadManagement: "Progressivo",
    },
    mentalDevelopment: {
      areas: ["Lideranca"],
      approach: "Mentoria com veteranos",
    },
    timeline: [
      { milestone: "Fase 1", expectedDate: "Mes 1", metric: "Passes +20%" },
    ],
    reasoning: "Plano baseado no perfil...",
  };

  it("calls callAgent with COACHING_ASSIST type", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    await runCoachingAssist({
      playerId: "p1",
      playerName: "Test Player",
      position: "CM",
      age: 21,
      currentClub: "FC Test",
      strengths: ["Passing", "Vision"],
      weaknesses: ["Defending", "Physical"],
      targetRole: "box-to-box midfielder",
    });

    expect(mockCallAgent).toHaveBeenCalledWith(
      expect.objectContaining({ agentType: "COACHING_ASSIST" })
    );
  });

  it("formats player profile in user message", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    await runCoachingAssist({
      playerId: "p1",
      playerName: "Joao Felix",
      position: "AM",
      age: 25,
      currentClub: "Barcelona",
      strengths: ["Dribbling", "Creativity"],
      weaknesses: ["Work rate", "Consistency"],
      targetRole: "false 9",
      formationContext: "4-2-3-1",
      developmentHorizon: "long",
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).toContain("Joao Felix");
    expect(msg).toContain("AM");
    expect(msg).toContain("25 anos");
    expect(msg).toContain("Barcelona");
    expect(msg).toContain("false 9");
    expect(msg).toContain("4-2-3-1");
    expect(msg).toContain("Longo prazo");
    expect(msg).toContain("Dribbling");
    expect(msg).toContain("Work rate");
  });

  it("defaults to medium horizon when not specified", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    await runCoachingAssist({
      playerId: "p1",
      playerName: "Test",
      position: "ST",
      age: 20,
      currentClub: "FC Test",
      strengths: ["Speed"],
      weaknesses: ["Finishing"],
      targetRole: "pressing forward",
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).toContain("Medio prazo");
  });

  it("includes short horizon label correctly", async () => {
    mockCallAgent.mockResolvedValueOnce({
      data: mockOutput,
      reasoning: "test",
      tokensUsed: 500,
      durationMs: 1000,
      model: "claude-sonnet-4-20250514",
    });

    await runCoachingAssist({
      playerId: "p1",
      playerName: "Test",
      position: "CB",
      age: 22,
      currentClub: "FC Test",
      strengths: ["Heading"],
      weaknesses: ["Passing"],
      targetRole: "ball-playing CB",
      developmentHorizon: "short",
    });

    const msg = mockCallAgent.mock.calls[0][0].userMessage;
    expect(msg).toContain("Curto prazo");
  });
});
