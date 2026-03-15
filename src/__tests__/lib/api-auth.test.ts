import { describe, it, expect, vi } from "vitest";

// Mock the DB module to avoid neon() connection error
vi.mock("@/db/index", () => ({
  db: { query: { organizations: { findFirst: vi.fn() } } },
}));
vi.mock("@/db/schema", () => ({
  organizations: {},
}));
vi.mock("@/db/queries", () => ({
  getApiKeyByHash: vi.fn(),
  touchApiKey: vi.fn(),
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

import { generateApiKey } from "@/lib/api-auth";

describe("generateApiKey", () => {
  it("generates a key starting with ctx_", () => {
    const { rawKey } = generateApiKey();
    expect(rawKey.startsWith("ctx_")).toBe(true);
  });

  it("generates a hex string of correct length", () => {
    const { rawKey } = generateApiKey();
    // ctx_ (4 chars) + 32 bytes * 2 hex chars = 64 hex chars
    expect(rawKey.length).toBe(4 + 64);
  });

  it("generates a SHA-256 hash", () => {
    const { keyHash } = generateApiKey();
    // SHA-256 produces 64 hex characters
    expect(keyHash.length).toBe(64);
    expect(keyHash).toMatch(/^[a-f0-9]+$/);
  });

  it("generates a truncated prefix", () => {
    const { rawKey, keyPrefix } = generateApiKey();
    expect(keyPrefix).toBe(rawKey.slice(0, 12) + "...");
    expect(keyPrefix.startsWith("ctx_")).toBe(true);
    expect(keyPrefix.endsWith("...")).toBe(true);
  });

  it("generates unique keys each time", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.rawKey).not.toBe(key2.rawKey);
    expect(key1.keyHash).not.toBe(key2.keyHash);
  });
});
