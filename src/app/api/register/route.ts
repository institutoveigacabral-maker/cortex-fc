import { NextResponse } from "next/server"
import { db } from "@/db/index"
import { users, organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, clubName } = body

    // Validate
    if (!name || !email || !password || !clubName) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      )
    }

    // Check existing user
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    if (existing) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      )
    }

    // Create org
    const slug =
      clubName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now().toString(36)

    const [org] = await db
      .insert(organizations)
      .values({
        name: clubName,
        slug,
        tier: "free",
      })
      .returning()

    // Create user
    const passwordHash = await bcrypt.hash(password, 10)
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        orgId: org.id,
        role: "admin",
      })
      .returning()

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
