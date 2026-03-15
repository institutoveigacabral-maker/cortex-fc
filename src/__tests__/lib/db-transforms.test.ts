import { describe, it, expect } from "vitest";
import {
  toNeuralLayers,
  toAlgorithmScores,
  toVxComponents,
  toRxComponents,
  formatPlayerForUI,
  formatDate,
  toScatterPoint,
  getDecisionColor,
} from "@/lib/db-transforms";

describe("toNeuralLayers", () => {
  it("maps camelCase DB fields to C1-C7 format", () => {
    const result = toNeuralLayers({
      c1Technical: 80,
      c2Tactical: 70,
      c3Physical: 60,
      c4Behavioral: 75,
      c5Narrative: 50,
      c6Economic: 65,
      c7Ai: 72,
    });
    expect(result).toEqual({
      C1_technical: 80,
      C2_tactical: 70,
      C3_physical: 60,
      C4_behavioral: 75,
      C5_narrative: 50,
      C6_economic: 65,
      C7_ai: 72,
    });
  });
});

describe("toAlgorithmScores", () => {
  it("maps DB fields to uppercase algorithm names", () => {
    const result = toAlgorithmScores({
      ast: 70,
      clf: 65,
      gne: 80,
      wse: 72,
      rbl: 68,
      sace: 74,
      scnPlus: 71,
    });
    expect(result.AST).toBe(70);
    expect(result.SCN_plus).toBe(71);
  });

  it("defaults null values to 0", () => {
    const result = toAlgorithmScores({
      ast: null,
      clf: null,
      gne: null,
      wse: null,
      rbl: null,
      sace: null,
      scnPlus: null,
    });
    expect(result.AST).toBe(0);
    expect(result.SCN_plus).toBe(0);
  });
});

describe("toVxComponents", () => {
  it("extracts VxComponents from raw JSONB", () => {
    const raw = {
      technical: 8,
      marketImpact: 7,
      culturalAdaptation: 6,
      networkingBenefit: 5,
      ageDepreciation: 3,
      liabilities: 2,
      regulatoryRisk: 1,
      totalCost: 50,
    };
    const result = toVxComponents(raw);
    expect(result.technical).toBe(8);
    expect(result.totalCost).toBe(50);
  });

  it("defaults missing fields to 0", () => {
    const result = toVxComponents({});
    expect(result.technical).toBe(0);
    expect(result.totalCost).toBe(0);
  });
});

describe("toRxComponents", () => {
  it("extracts RxComponents from raw JSONB", () => {
    const raw = {
      tacticalGap: 7,
      contextualFit: 6,
      experienceProfile: 5,
      narrativeIndex: 4,
      mentalFortitude: 8,
      injuryMicroRisk: 3,
      suspensionRisk: 2,
      valueAtRisk: 10,
      marketJitter: 5,
    };
    const result = toRxComponents(raw);
    expect(result.tacticalGap).toBe(7);
    expect(result.marketJitter).toBe(5);
  });

  it("defaults missing fields to 0", () => {
    const result = toRxComponents({});
    expect(result.tacticalGap).toBe(0);
    expect(result.valueAtRisk).toBe(0);
  });
});

describe("formatPlayerForUI", () => {
  const fullPlayer = {
    id: "p1",
    name: "Vinicius Jr",
    age: 24,
    nationality: "Brazil",
    positionDetail: "Left Winger",
    positionCluster: "W",
    currentClub: { name: "Real Madrid" },
    marketValue: 150,
    salary: 12,
    contractUntil: new Date("2027-06-30"),
    photoUrl: "https://example.com/photo.jpg",
  };

  it("maps all fields correctly", () => {
    const result = formatPlayerForUI(fullPlayer);
    expect(result.id).toBe("p1");
    expect(result.name).toBe("Vinicius Jr");
    expect(result.position).toBe("Left Winger");
    expect(result.positionCluster).toBe("W");
    expect(result.club).toBe("Real Madrid");
    expect(result.marketValue).toBe(150);
    expect(result.contractEnd).toBe("2027-06-30");
  });

  it("falls back to positionCluster when positionDetail is null", () => {
    const result = formatPlayerForUI({ ...fullPlayer, positionDetail: null });
    expect(result.position).toBe("W");
  });

  it("shows 'Sem clube' when currentClub is null", () => {
    const result = formatPlayerForUI({ ...fullPlayer, currentClub: null });
    expect(result.club).toBe("Sem clube");
  });

  it("defaults marketValue and salary to 0 when null", () => {
    const result = formatPlayerForUI({
      ...fullPlayer,
      marketValue: null,
      salary: null,
    });
    expect(result.marketValue).toBe(0);
    expect(result.salary).toBe(0);
  });

  it("shows N/A for contractEnd when contractUntil is null", () => {
    const result = formatPlayerForUI({ ...fullPlayer, contractUntil: null });
    expect(result.contractEnd).toBe("N/A");
  });
});

describe("formatDate", () => {
  it("formats Date object to pt-BR format", () => {
    const result = formatDate(new Date("2025-03-15T12:00:00Z"));
    // pt-BR format: DD/MM/YYYY
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toContain("2025");
  });

  it("handles string dates", () => {
    const result = formatDate("2025-06-30");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("toScatterPoint", () => {
  it("transforms analysis to scatter data point", () => {
    const result = toScatterPoint({
      vx: 1.8,
      rx: 0.7,
      decision: "CONTRATAR",
      scnPlus: 85,
      player: { name: "Test Player" },
    });
    expect(result.name).toBe("Test Player");
    expect(result.vx).toBe(1.8);
    expect(result.rx).toBe(0.7);
    expect(result.decision).toBe("CONTRATAR");
    expect(result.scn).toBe(85);
  });

  it("uses 'Desconhecido' when player is null", () => {
    const result = toScatterPoint({
      vx: 1.0,
      rx: 1.0,
      decision: "MONITORAR",
      scnPlus: null,
      player: null,
    });
    expect(result.name).toBe("Desconhecido");
    expect(result.scn).toBe(0);
  });
});

describe("getDecisionColor", () => {
  it("returns emerald colors for CONTRATAR", () => {
    const result = getDecisionColor("CONTRATAR");
    expect(result.fill).toBe("#10b981");
    expect(result.text).toContain("emerald");
  });

  it("returns blue colors for BLINDAR", () => {
    const result = getDecisionColor("BLINDAR");
    expect(result.fill).toBe("#3b82f6");
  });

  it("returns amber colors for MONITORAR", () => {
    const result = getDecisionColor("MONITORAR");
    expect(result.fill).toBe("#f59e0b");
  });

  it("returns purple colors for EMPRESTIMO", () => {
    const result = getDecisionColor("EMPRESTIMO");
    expect(result.fill).toBe("#a855f7");
  });

  it("returns red colors for RECUSAR", () => {
    const result = getDecisionColor("RECUSAR");
    expect(result.fill).toBe("#ef4444");
  });

  it("returns zinc colors for ALERTA_CINZA", () => {
    const result = getDecisionColor("ALERTA_CINZA");
    expect(result.fill).toBe("#71717a");
  });
});
