/**
 * Real-time pub/sub system using Upstash Redis.
 *
 * Provides channel-based event publishing and polling,
 * plus presence tracking for connected users.
 *
 * Used by the SSE stream route to deliver events to clients.
 */

import { redis } from "./cache"

export type RealtimeChannel =
  | "notifications"
  | "agent-progress"
  | "chat-typing"
  | "presence"

export interface RealtimeEvent {
  channel: RealtimeChannel
  type: string
  data: unknown
  userId?: string
  orgId: string
  timestamp: number
}

/**
 * Publish an event to a channel (called from API routes after mutations).
 * Events are stored in a Redis list with automatic TTL and size cap.
 */
export async function publishEvent(
  event: Omit<RealtimeEvent, "timestamp">
): Promise<void> {
  if (!redis) return
  const fullEvent: RealtimeEvent = { ...event, timestamp: Date.now() }
  const key = `realtime:${event.orgId}:${event.channel}`
  // Store in a Redis list, keep last 100 events
  await redis.lpush(key, JSON.stringify(fullEvent))
  await redis.ltrim(key, 0, 99)
  await redis.expire(key, 3600) // 1h TTL
}

/**
 * Get events since a given timestamp (for SSE polling).
 * Returns events oldest-first so clients process them in order.
 */
export async function getEventsSince(
  orgId: string,
  channel: RealtimeChannel,
  since: number
): Promise<RealtimeEvent[]> {
  if (!redis) return []
  const key = `realtime:${orgId}:${channel}`
  const all = await redis.lrange(key, 0, 49)
  return (all as string[])
    .map((s) => {
      try {
        return JSON.parse(typeof s === "string" ? s : JSON.stringify(s)) as RealtimeEvent
      } catch {
        return null
      }
    })
    .filter((e): e is RealtimeEvent => e !== null && e.timestamp > since)
    .reverse() // oldest first
}

/**
 * Set presence for a user on a specific page.
 * Presence entries expire after 5 minutes if not refreshed.
 */
export async function setPresence(
  orgId: string,
  userId: string,
  page: string
): Promise<void> {
  if (!redis) return
  const key = `presence:${orgId}`
  await redis.hset(key, {
    [userId]: JSON.stringify({ page, lastSeen: Date.now() }),
  })
  await redis.expire(key, 300) // 5min TTL
}

/**
 * Get all active presence entries for an org.
 * Filters out stale entries (older than 2 minutes).
 */
export async function getPresence(
  orgId: string
): Promise<Array<{ userId: string; page: string; lastSeen: number }>> {
  if (!redis) return []
  const key = `presence:${orgId}`
  const all = await redis.hgetall(key)
  if (!all) return []
  const now = Date.now()
  return Object.entries(all)
    .map(([userId, val]) => {
      try {
        const { page, lastSeen } = JSON.parse(val as string)
        if (now - lastSeen > 120000) return null // stale after 2min
        return { userId, page, lastSeen }
      } catch {
        return null
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
}
