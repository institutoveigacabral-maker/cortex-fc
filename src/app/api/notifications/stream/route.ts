import { NextRequest } from "next/server"
import { getAuthSession } from "@/lib/auth-helpers"
import { db } from "@/db/index"
import { notifications } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import {
  getEventsSince,
  getPresence,
  setPresence,
  type RealtimeChannel,
} from "@/lib/realtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_CHANNELS: RealtimeChannel[] = [
  "notifications",
  "agent-progress",
  "chat-typing",
  "presence",
]

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const userId = session.userId
  const orgId = (session as Record<string, string>).orgId ?? "default"
  const encoder = new TextEncoder()

  // Parse requested channels from query param
  const channelsParam = req.nextUrl.searchParams.get("channels") ?? "notifications"
  const requestedChannels = channelsParam
    .split(",")
    .map((c) => c.trim() as RealtimeChannel)
    .filter((c) => VALID_CHANNELS.includes(c))

  // Default to notifications if none valid
  if (requestedChannels.length === 0) {
    requestedChannels.push("notifications")
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(": heartbeat\n\n"))

      let lastCheck = new Date()
      let lastEventTimestamp = Date.now()
      // heartbeatCount can be used for diagnostics in the future

      // Poll every 2 seconds for new events
      const interval = setInterval(async () => {
        try {
          // --- Channel: notifications (DB-backed, backward compatible) ---
          if (requestedChannels.includes("notifications")) {
            const newNotifs = await db
              .select()
              .from(notifications)
              .where(
                and(
                  eq(notifications.userId, userId),
                  sql`${notifications.createdAt} > ${lastCheck}`
                )
              )
              .orderBy(desc(notifications.createdAt))
              .limit(20)

            if (newNotifs.length > 0) {
              lastCheck = new Date()
              const payload = newNotifs.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                entityType: n.entityType,
                entityId: n.entityId,
                readAt: n.readAt?.toISOString() ?? null,
                createdAt: n.createdAt.toISOString(),
              }))
              // Send as named event for new hook, and as default data for backward compat
              controller.enqueue(
                encoder.encode(
                  `event: notification\ndata: ${JSON.stringify(payload)}\n\n`
                )
              )
              // Also send as generic data event for backward compatibility
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
              )
            }
          }

          // --- Channel: agent-progress (Redis-backed) ---
          if (requestedChannels.includes("agent-progress")) {
            const events = await getEventsSince(
              orgId,
              "agent-progress",
              lastEventTimestamp
            )
            for (const evt of events) {
              controller.enqueue(
                encoder.encode(
                  `event: agent-progress\ndata: ${JSON.stringify(evt)}\n\n`
                )
              )
            }
            if (events.length > 0) {
              lastEventTimestamp = Math.max(
                lastEventTimestamp,
                ...events.map((e) => e.timestamp)
              )
            }
          }

          // --- Channel: presence (Redis-backed) ---
          if (requestedChannels.includes("presence")) {
            const presence = await getPresence(orgId)
            if (presence.length > 0) {
              controller.enqueue(
                encoder.encode(
                  `event: presence\ndata: ${JSON.stringify(presence)}\n\n`
                )
              )
            }
          }

          // --- Channel: chat-typing (Redis-backed) ---
          if (requestedChannels.includes("chat-typing")) {
            const events = await getEventsSince(
              orgId,
              "chat-typing",
              lastEventTimestamp
            )
            for (const evt of events) {
              controller.enqueue(
                encoder.encode(
                  `event: chat-typing\ndata: ${JSON.stringify(evt)}\n\n`
                )
              )
            }
            if (events.length > 0) {
              lastEventTimestamp = Math.max(
                lastEventTimestamp,
                ...events.map((e) => e.timestamp)
              )
            }
          }
        } catch {
          // Silently handle errors to keep the stream alive
        }
      }, 2000)

      // Heartbeat every 30s to keep connection alive + update presence
      const heartbeat = setInterval(async () => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
          // Update presence alongside heartbeat if presence channel is subscribed
          if (requestedChannels.includes("presence")) {
            const page =
              req.nextUrl.searchParams.get("page") ?? "unknown"
            await setPresence(orgId, userId, page)
          }
        } catch {
          clearInterval(interval)
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        clearInterval(interval)
        clearInterval(heartbeat)
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
