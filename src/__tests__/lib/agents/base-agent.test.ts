import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures the fn is created before vi.mock runs
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

import { callAgent } from "@/lib/agents/base-agent";

describe("callAgent", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("parses JSON from response text block", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: '{"vx": 1.5, "decision": "CONTRATAR"}',
        },
      ],
      usage: { input_tokens: 100, output_tokens: 200 },
    });

    const result = await callAgent({
      agentType: "ORACLE",
      systemPrompt: "You are a test agent",
      userMessage: "Test query",
      timeoutMs: 5000,
    });

    expect(result.data).toEqual({ vx: 1.5, decision: "CONTRATAR" });
    expect(result.tokensUsed).toBe(300);
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(200);
    expect(result.costUsd).toBeGreaterThan(0);
    expect(result.model).toBe("claude-sonnet-4-20250514");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("extracts JSON from markdown code blocks", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: 'Here is my analysis:\n```json\n{"score": 85}\n```\nThat concludes it.',
        },
      ],
      usage: { input_tokens: 50, output_tokens: 100 },
    });

    const result = await callAgent({
      agentType: "ANALISTA",
      systemPrompt: "Test",
      userMessage: "Test",
      timeoutMs: 5000,
    });

    expect(result.data).toEqual({ score: 85 });
  });

  it("falls back to raw text when JSON parsing fails", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: "This is just plain text without JSON",
        },
      ],
      usage: { input_tokens: 30, output_tokens: 50 },
    });

    const result = await callAgent<{ raw: string }>({
      agentType: "SCOUT",
      systemPrompt: "Test",
      userMessage: "Test",
      timeoutMs: 5000,
    });

    expect(result.data.raw).toBe("This is just plain text without JSON");
  });

  it("uses custom model and maxTokens when provided", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: '{"ok": true}' }],
      usage: { input_tokens: 10, output_tokens: 10 },
    });

    await callAgent({
      agentType: "ORACLE",
      systemPrompt: "Test",
      userMessage: "Test",
      model: "claude-opus-4-20250514",
      maxTokens: 8192,
      timeoutMs: 5000,
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-opus-4-20250514",
        max_tokens: 8192,
      }),
      expect.anything()
    );
  });

  it("retries on 429 error then succeeds", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("429 Too Many Requests"))
      .mockResolvedValueOnce({
        content: [{ type: "text", text: '{"retry": "success"}' }],
        usage: { input_tokens: 10, output_tokens: 10 },
      });

    const result = await callAgent({
      agentType: "ORACLE",
      systemPrompt: "Test",
      userMessage: "Test",
      timeoutMs: 10000,
    });

    expect(result.data).toEqual({ retry: "success" });
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws on non-retryable error without retry", async () => {
    mockCreate.mockRejectedValueOnce(new Error("400 Bad Request"));

    await expect(
      callAgent({
        agentType: "ORACLE",
        systemPrompt: "Test",
        userMessage: "Test",
        timeoutMs: 5000,
      })
    ).rejects.toThrow("400 Bad Request");

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("stores reasoning as the full raw text", async () => {
    const rawText = "Detalhes da analise completa aqui...";
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: rawText }],
      usage: { input_tokens: 10, output_tokens: 10 },
    });

    const result = await callAgent({
      agentType: "ORACLE",
      systemPrompt: "Test",
      userMessage: "Test",
      timeoutMs: 5000,
    });

    expect(result.reasoning).toBe(rawText);
  });

  it("handles response with no text block gracefully", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "tool_use", id: "tool1", name: "test", input: {} }],
      usage: { input_tokens: 10, output_tokens: 10 },
    });

    const result = await callAgent<{ raw: string }>({
      agentType: "ORACLE",
      systemPrompt: "Test",
      userMessage: "Test",
      timeoutMs: 5000,
    });

    // No text block -> empty string -> falls back to { raw: "" }
    expect(result.data.raw).toBe("");
  });
});
