/**
 * Background report generation via Inngest.
 *
 * Hook point for async PDF/report generation.
 * Publishes real-time notifications on start and completion.
 */

import { inngest } from "@/lib/inngest-client"
import { publishEvent } from "@/lib/realtime"

export const generateReportBackground = inngest.createFunction(
  { id: "generate-report-background", name: "Generate Report in Background" },
  { event: "report/generate.requested" },
  async ({ event, step }) => {
    const { reportType, orgId, userId, params } = event.data

    await step.run("notify-started", async () => {
      await publishEvent({
        channel: "notifications",
        type: "report.generating",
        data: { reportType, params },
        userId,
        orgId,
      })
    })

    // Actual PDF generation would go here
    // For now, this is the hook point for future implementation

    await step.run("notify-completed", async () => {
      await publishEvent({
        channel: "notifications",
        type: "report.completed",
        data: { reportType, params },
        userId,
        orgId,
      })
    })

    return { success: true }
  }
)
