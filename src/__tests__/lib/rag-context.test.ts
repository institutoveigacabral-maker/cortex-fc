import { describe, it, expect, vi } from "vitest";

// Mock DB to avoid neon() connection error at import time
vi.mock("@/db/index", () => ({
  db: {
    query: {
      organizations: { findFirst: vi.fn() },
      neuralAnalyses: { findMany: vi.fn() },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
        groupBy: vi.fn().mockResolvedValue([]),
        where: vi.fn().mockResolvedValue([{ avg: 0 }]),
      }),
    }),
  },
}));
vi.mock("@/db/schema", () => ({
  players: {},
  neuralAnalyses: { analystId: "analystId", createdAt: "createdAt", scnPlus: "scnPlus" },
  scoutingTargets: { id: "id", priority: "p", status: "s", targetPrice: "tp", playerId: "pid", orgId: "oid", createdAt: "ca", analysisId: "aid" },
  clubs: { id: "id", name: "name" },
  organizations: { id: "id" },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
  count: vi.fn(),
  avg: vi.fn(),
}));

import { buildChatSystemPrompt, generateSuggestions } from "@/lib/rag-context";
import type { RagContext } from "@/lib/rag-context";

describe("buildChatSystemPrompt", () => {
  const rag: RagContext = {
    orgSummary: "Organizacao: Test FC | Tier: club_professional | Slug: test-fc",
    recentAnalyses: "Ultimas 3 analises neurais:\n- Player A: SCN+=82, Decisao=CONTRATAR",
    squadOverview: "Base de dados: 50 jogadores\nSCN+ medio geral: 68.5",
    scoutingPipeline: "Pipeline de scouting (5 alvos):\n- Player X (CB, FC Example): Prioridade=high",
  };

  it("includes org summary in prompt", () => {
    const prompt = buildChatSystemPrompt(rag);
    expect(prompt).toContain("Test FC");
    expect(prompt).toContain("club_professional");
  });

  it("includes squad overview", () => {
    const prompt = buildChatSystemPrompt(rag);
    expect(prompt).toContain("50 jogadores");
    expect(prompt).toContain("68.5");
  });

  it("includes recent analyses", () => {
    const prompt = buildChatSystemPrompt(rag);
    expect(prompt).toContain("Player A");
    expect(prompt).toContain("SCN+=82");
    expect(prompt).toContain("CONTRATAR");
  });

  it("includes scouting pipeline", () => {
    const prompt = buildChatSystemPrompt(rag);
    expect(prompt).toContain("5 alvos");
    expect(prompt).toContain("Player X");
  });

  it("instructs to respond in PT-BR", () => {
    const prompt = buildChatSystemPrompt(rag);
    expect(prompt).toContain("portugues");
    expect(prompt).toContain("PT-BR");
  });

  it("instructs not to invent data", () => {
    const prompt = buildChatSystemPrompt(rag);
    expect(prompt).toContain("Nunca invente dados");
  });
});

describe("generateSuggestions", () => {
  it("always includes base suggestions", () => {
    const rag: RagContext = {
      orgSummary: "Org",
      recentAnalyses: "Nenhuma analise",
      squadOverview: "0 jogadores",
      scoutingPipeline: "Nenhum alvo",
    };
    const suggestions = generateSuggestions(rag);
    expect(suggestions).toContainEqual(expect.stringContaining("panorama geral"));
    expect(suggestions).toContainEqual(expect.stringContaining("melhor SCN+"));
  });

  it("adds scouting suggestions when pipeline has targets", () => {
    const rag: RagContext = {
      orgSummary: "Org",
      recentAnalyses: "Nenhuma",
      squadOverview: "Squad",
      scoutingPipeline: "Pipeline de scouting (5 alvos):\n- Player X",
    };
    const suggestions = generateSuggestions(rag);
    expect(suggestions).toContainEqual(expect.stringContaining("pipeline de scouting"));
  });

  it("adds CONTRATAR suggestion when analyses contain it", () => {
    const rag: RagContext = {
      orgSummary: "Org",
      recentAnalyses: "Player A: Decisao=CONTRATAR",
      squadOverview: "Squad",
      scoutingPipeline: "Nenhum alvo",
    };
    const suggestions = generateSuggestions(rag);
    expect(suggestions).toContainEqual(expect.stringContaining("contratacao"));
  });

  it("adds MONITORAR suggestion when analyses contain it", () => {
    const rag: RagContext = {
      orgSummary: "Org",
      recentAnalyses: "Player B: Decisao=MONITORAR",
      squadOverview: "Squad",
      scoutingPipeline: "Nenhum alvo",
    };
    const suggestions = generateSuggestions(rag);
    expect(suggestions).toContainEqual(expect.stringContaining("monitoramento"));
  });

  it("returns at most 6 suggestions", () => {
    const rag: RagContext = {
      orgSummary: "Org",
      recentAnalyses: "CONTRATAR MONITORAR",
      squadOverview: "Squad",
      scoutingPipeline: "Pipeline de scouting (5 alvos)",
    };
    const suggestions = generateSuggestions(rag);
    expect(suggestions.length).toBeLessThanOrEqual(6);
  });
});
