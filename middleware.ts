import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/")
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")

  // Allow auth routes through
  if (isAuthRoute) return NextResponse.next()

  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/players/:path*",
    "/analysis/:path*",
    "/scouting/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/players/:path*",
    "/api/analyses/:path*",
  ],
}
