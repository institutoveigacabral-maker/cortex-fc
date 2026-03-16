import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows through when limiter is null (dev mode)", async () => {
    const result = await checkRateLimit(null, "test-ip");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(999);
  });

  it("calls limiter.limit with identifier when limiter exists", async () => {
    const mockLimiter = {
      limit: async (id: string) => ({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
        pending: Promise.resolve(),
      }),
    };
    const result = await checkRateLimit(mockLimiter as unknown as Parameters<typeof checkRateLimit>[0], "test-user");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it("returns failure when limiter denies", async () => {
    const mockLimiter = {
      limit: async (id: string) => ({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
        pending: Promise.resolve(),
      }),
    };
    const result = await checkRateLimit(mockLimiter as unknown as Parameters<typeof checkRateLimit>[0], "spam-ip");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
