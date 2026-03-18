/**
 * Scheduled Reports — Inngest cron function (Sprint 8.2d)
 *
 * Runs every hour to check for due scheduled reports,
 * triggers report generation, sends emails to recipients,
 * and updates the schedule.
 */

import { inngest } from "@/lib/inngest-client";
import {
  getDueSchedules,
  updateReportSchedule,
  calculateNextRun,
} from "@/db/queries/reports";
import { publishEvent } from "@/lib/realtime";
import { sendScheduledReportEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app";

export const processScheduledReports = inngest.createFunction(
  { id: "process-scheduled-reports", name: "Process Scheduled Reports" },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    const dueSchedules = await step.run("fetch-due-schedules", async () => {
      return getDueSchedules();
    });

    if (dueSchedules.length === 0) {
      logger.info("[ScheduledReports] No due schedules found");
      return { processed: 0 };
    }

    logger.info("[ScheduledReports] Found due schedules", { count: dueSchedules.length });

    for (const schedule of dueSchedules) {
      await step.run(`generate-${schedule.id}`, async () => {
        const reportTitle =
          schedule.title ??
          `Relatorio Agendado — ${new Date().toLocaleDateString("pt-BR")}`;

        // Trigger report generation via Inngest event
        await inngest.send({
          name: "report/generate.requested",
          data: {
            reportType: schedule.template,
            orgId: schedule.orgId,
            userId: schedule.createdBy,
            params: {
              title: reportTitle,
              scheduled: true,
              scheduleId: schedule.id,
            },
          },
        });

        logger.info("[ScheduledReports] Report generation triggered", {
          scheduleId: schedule.id,
          template: schedule.template,
          orgId: schedule.orgId,
        });

        // Calculate next run and update schedule
        const nextRunAt = calculateNextRun(
          schedule.frequency,
          schedule.dayOfWeek ?? undefined,
          schedule.dayOfMonth ?? undefined,
          schedule.hour
        );

        await updateReportSchedule(schedule.id, schedule.orgId, {
          lastRunAt: new Date(),
          nextRunAt,
        });

        logger.info("[ScheduledReports] Schedule updated", {
          scheduleId: schedule.id,
          nextRunAt: nextRunAt.toISOString(),
        });

        // Send emails to all recipients
        const recipients = schedule.recipientEmails ?? [];
        if (recipients.length > 0) {
          const viewUrl = `${APP_URL}/reports`;

          const emailResults = await Promise.allSettled(
            recipients.map((email) =>
              sendScheduledReportEmail(
                email,
                reportTitle,
                schedule.template,
                viewUrl,
                schedule.orgId,
              )
            )
          );

          const succeeded = emailResults.filter((r) => r.status === "fulfilled" && r.value).length;
          const failed = emailResults.length - succeeded;

          logger.info("[ScheduledReports] Emails sent", {
            scheduleId: schedule.id,
            total: recipients.length,
            succeeded,
            failed,
          });

          if (failed > 0) {
            logger.warn("[ScheduledReports] Some emails failed to send", {
              scheduleId: schedule.id,
              failedCount: failed,
            });
          }
        }

        await publishEvent({
          channel: "notifications",
          type: "report.scheduled.generated",
          orgId: schedule.orgId,
          data: { scheduleId: schedule.id, template: schedule.template },
        });
      });
    }

    return { processed: dueSchedules.length };
  }
);
