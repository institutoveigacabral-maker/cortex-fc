import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { organizations, players } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import DashboardShell from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.orgId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, session.user.orgId as string),
      columns: { onboardingCompletedAt: true },
    });

    if (org && !org.onboardingCompletedAt) {
      redirect("/onboarding");
    }

    // After onboarding is complete, if zero players exist in the DB,
    // redirect to /players?firstTime=true so the user lands on a useful page.
    // We check the referer/URL to avoid redirect loops (only redirect if
    // user is NOT already on /players).
    if (org?.onboardingCompletedAt) {
      const headersList = await headers();
      const url = headersList.get("x-url") ?? headersList.get("referer") ?? "";
      const alreadyOnPlayers = url.includes("/players");

      if (!alreadyOnPlayers) {
        const [result] = await db
          .select({ total: count() })
          .from(players);

        if (result && result.total === 0) {
          redirect("/players?firstTime=true");
        }
      }
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
