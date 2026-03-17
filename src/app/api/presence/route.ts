import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { setPresence, getPresence } from "@/lib/realtime"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { page } = await req.json()
  await setPresence(session.user.orgId, session.user.id, page || "/")
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const page = req.nextUrl.searchParams.get("page")
  const all = await getPresence(session.user.orgId)

  // Filter by page if specified, exclude self
  const viewers = all.filter(p =>
    p.userId !== session.user!.id && (!page || p.page === page)
  )

  return NextResponse.json({ viewers })
}
