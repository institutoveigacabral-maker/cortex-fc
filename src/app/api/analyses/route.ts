import { NextResponse } from "next/server";
import { getAnalyses, createAnalysis } from "@/db/queries";

// ============================================
// VALIDATION HELPERS
// ============================================

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const VALID_DECISIONS = [
  "CONTRATAR",
  "BLINDAR",
  "MONITORAR",
  "EMPRESTIMO",
  "RECUSAR",
  "ALERTA_CINZA",
] as const;

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && !Number.isNaN(value) && value >= min && value <= max;
}

// ============================================
// ROUTES
// ============================================

export async function GET() {
  try {
    const analyses = await getAnalyses();
    return NextResponse.json({ data: analyses });
  } catch (error) {
    console.error("Failed to fetch analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields are present
    const requiredFields = [
      "playerId",
      "clubContextId",
      "vx",
      "rx",
      "vxComponents",
      "rxComponents",
      "c1Technical",
      "c2Tactical",
      "c3Physical",
      "c4Behavioral",
      "c5Narrative",
      "c6Economic",
      "c7Ai",
      "decision",
      "confidence",
      "reasoning",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate UUID fields
    if (typeof body.playerId !== "string" || !isValidUUID(body.playerId)) {
      return NextResponse.json(
        { error: "playerId must be a valid UUID" },
        { status: 400 }
      );
    }
    if (typeof body.clubContextId !== "string" || !isValidUUID(body.clubContextId)) {
      return NextResponse.json(
        { error: "clubContextId must be a valid UUID" },
        { status: 400 }
      );
    }

    // Validate numeric ranges: vx and rx are 0-1
    if (!isNumberInRange(body.vx, 0, 1)) {
      return NextResponse.json(
        { error: "vx must be a number between 0 and 1" },
        { status: 400 }
      );
    }
    if (!isNumberInRange(body.rx, 0, 1)) {
      return NextResponse.json(
        { error: "rx must be a number between 0 and 1" },
        { status: 400 }
      );
    }

    // Validate cortex layer scores (c1-c7): 0-100
    const layerFields = [
      "c1Technical",
      "c2Tactical",
      "c3Physical",
      "c4Behavioral",
      "c5Narrative",
      "c6Economic",
      "c7Ai",
    ] as const;
    for (const field of layerFields) {
      if (!isNumberInRange(body[field], 0, 100)) {
        return NextResponse.json(
          { error: `${field} must be a number between 0 and 100` },
          { status: 400 }
        );
      }
    }

    // Validate confidence: 0-100
    if (!isNumberInRange(body.confidence, 0, 100)) {
      return NextResponse.json(
        { error: "confidence must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate decision enum
    if (!VALID_DECISIONS.includes(body.decision)) {
      return NextResponse.json(
        { error: `decision must be one of: ${VALID_DECISIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate and sanitize reasoning
    if (typeof body.reasoning !== "string") {
      return NextResponse.json(
        { error: "reasoning must be a string" },
        { status: 400 }
      );
    }
    const sanitizedReasoning = stripHtmlTags(body.reasoning);
    if (sanitizedReasoning.length === 0) {
      return NextResponse.json(
        { error: "reasoning must be a non-empty string" },
        { status: 400 }
      );
    }
    if (sanitizedReasoning.length > 5000) {
      return NextResponse.json(
        { error: "reasoning must not exceed 5000 characters" },
        { status: 400 }
      );
    }

    // Build a sanitized payload with only the expected fields
    const sanitizedBody = {
      playerId: body.playerId,
      clubContextId: body.clubContextId,
      vx: body.vx,
      rx: body.rx,
      vxComponents: body.vxComponents,
      rxComponents: body.rxComponents,
      c1Technical: body.c1Technical,
      c2Tactical: body.c2Tactical,
      c3Physical: body.c3Physical,
      c4Behavioral: body.c4Behavioral,
      c5Narrative: body.c5Narrative,
      c6Economic: body.c6Economic,
      c7Ai: body.c7Ai,
      decision: body.decision,
      confidence: body.confidence,
      reasoning: sanitizedReasoning,
      ...(body.analystId && typeof body.analystId === "string" && isValidUUID(body.analystId)
        ? { analystId: body.analystId }
        : {}),
    };

    const analysis = await createAnalysis(sanitizedBody);
    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch (error) {
    console.error("Failed to create analysis:", error);
    return NextResponse.json(
      { error: "Failed to create analysis" },
      { status: 500 }
    );
  }
}
