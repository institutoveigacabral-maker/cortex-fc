import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      playerId,
      clubContextId,
      playerName,
      position,
      age,
      nationality,
      currentClub,
      marketValue,
      contractEnd,
      targetClubName,
      targetClubLeague,
    } = body

    if (!playerId || !clubContextId || !playerName || !position) {
      return NextResponse.json(
        { error: "playerId, clubContextId, playerName, and position are required" },
        { status: 400 }
      )
    }

    // Check for API key before attempting the call
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nao configurada. Configure a variavel de ambiente para usar a geracao por IA." },
        { status: 503 }
      )
    }

    // Import dynamically to avoid loading Anthropic SDK on every request
    const { runOracleWithPlayerData } = await import("@/lib/agents/oracle-agent")

    const result = await runOracleWithPlayerData({
      playerId,
      clubContextId,
      vxComponents: {},
      rxComponents: {},
      playerName,
      playerAge: age ?? 25,
      position,
      nationality: nationality ?? "",
      currentClub: currentClub ?? "",
      marketValue: marketValue ?? 0,
      contractUntil: contractEnd,
      buyingClubName: targetClubName ?? "",
      buyingClubLeague: targetClubLeague ?? "",
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("ORACLE agent error:", error)
    const message =
      error instanceof Error ? error.message : "Erro ao executar analise neural"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
