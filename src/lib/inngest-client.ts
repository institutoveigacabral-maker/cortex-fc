/**
 * Inngest client — single instance for the app.
 *
 * Events are typed so producers and consumers share the same contract.
 */

import { Inngest, EventSchemas } from "inngest";

type CortexEvents = {
  "cortex/analysis.created": {
    data: {
      analysisId: string;
      playerId: string;
      orgId: string;
      userId: string;
      playerName: string;
    };
  };
  "cortex/report.generated": {
    data: {
      reportId: string;
      orgId: string;
      userId: string;
      analysisId: string;
    };
  };
  "cortex/agent.completed": {
    data: {
      agentType: string;
      orgId: string;
      userId: string;
      runId: string;
      playerId?: string;
    };
  };
  "cortex/scouting.target.added": {
    data: {
      targetId: string;
      orgId: string;
      userId: string;
      playerName: string;
    };
  };
  "cortex/cache.invalidate": {
    data: {
      key?: string;
      prefix?: string;
    };
  };
  "agent/run.requested": {
    data: {
      agentType: string;
      systemPrompt: string;
      userMessage: string;
      model?: string;
      maxTokens?: number;
      userId: string;
      orgId: string;
      metadata?: Record<string, unknown>;
    };
  };
  "report/generate.requested": {
    data: {
      reportType: string;
      orgId: string;
      userId: string;
      params?: Record<string, unknown>;
    };
  };
};

export const inngest = new Inngest({
  id: "cortex-fc",
  schemas: new EventSchemas().fromRecord<CortexEvents>(),
});
