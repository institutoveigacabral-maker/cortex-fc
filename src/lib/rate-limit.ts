import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiters for CORTEX FC
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Falls back to no-op if env vars not configured (dev mode).
 */

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * General API rate limit: 100 requests per minute per IP
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "cortex:api",
    })
  : null;

/**
 * AI agent rate limit: 10 requests per minute per user
 */
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "cortex:ai",
    })
  : null;

/**
 * Org-level AI agent rate limit: 30 requests per minute per org
 */
export const orgAiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "cortex:org-ai",
    })
  : null;

/**
 * Auth rate limit: 5 attempts per minute per IP (login/register)
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "cortex:auth",
    })
  : null;

/**
 * Check rate limit. Returns { success, remaining } or allows through if Redis not configured.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) {
    // No Redis configured — allow through (dev mode)
    return { success: true, remaining: 999 };
  }

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
  };
}

/**
 * Check both user-level and org-level rate limits for agent calls.
 * Returns whether the request is allowed, and if not, which limit was hit.
 */
export async function checkAgentRateLimits(
  userId: string,
  orgId: string
): Promise<{
  allowed: boolean;
  retryAfter?: number;
  limitType?: "user" | "org";
}> {
  // Check user-level limit
  if (aiRateLimit) {
    const userResult = await aiRateLimit.limit(`ai:${userId}`);
    if (!userResult.success) {
      return {
        allowed: false,
        retryAfter: Math.ceil((userResult.reset - Date.now()) / 1000),
        limitType: "user",
      };
    }
  }

  // Check org-level limit
  if (orgAiRateLimit) {
    const orgResult = await orgAiRateLimit.limit(`org-ai:${orgId}`);
    if (!orgResult.success) {
      return {
        allowed: false,
        retryAfter: Math.ceil((orgResult.reset - Date.now()) / 1000),
        limitType: "org",
      };
    }
  }

  return { allowed: true };
}
