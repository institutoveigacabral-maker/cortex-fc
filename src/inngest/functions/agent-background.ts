/**
 * Background agent execution via Inngest.
 *
 * Runs an AI agent asynchronously, saves audit trail,
 * and publishes real-time progress events via the pub/sub system.
 */

import { inngest } from "@/lib/inngest-client"
import { callAgent } from "@/lib/agents/base-agent"
import { createAgentRun } from "@/db/queries"
import { publishEvent } from "@/lib/realtime"
import type { AgentType } from "@/types/cortex"

export const runAgentBackground = inngest.createFunction(
  { id: "run-agent-background", name: "Run Agent in Background" },
  { event: "agent/run.requested" },
  async ({ event, step }) => {
    const {
      agentType,
      systemPrompt,
      userMessage,
      model,
      maxTokens,
      userId,
      orgId,
      metadata,
    } = event.data

    const startTime = Date.now()

    // Publish progress event
    await step.run("notify-started", async () => {
      await publishEvent({
        channel: "agent-progress",
        type: "agent.started",
        data: { agentType, metadata },
        userId,
        orgId,
      })
    })

    // Run the agent
    const result = await step.run("execute-agent", async () => {
      return callAgent({
        agentType: agentType as AgentType,
        systemPrompt,
        userMessage,
        model,
        maxTokens,
      })
    })

    // Save audit trail
    await step.run("save-audit", async () => {
      const duration = Date.now() - startTime
      await createAgentRun({
        orgId,
        userId,
        agentType: agentType as AgentType,
        inputContext: { metadata: metadata ?? {} },
        outputResult: result as Record<string, unknown> | undefined,
        success: true,
        durationMs: duration,
        modelUsed: model || "claude-sonnet-4-20250514",
        tokensUsed: 0, // TODO: extract from response
      })
    })

    // Publish completion
    await step.run("notify-completed", async () => {
      await publishEvent({
        channel: "agent-progress",
        type: "agent.completed",
        data: { agentType, result, metadata },
        userId,
        orgId,
      })
    })

    return { success: true, result }
  }
)
