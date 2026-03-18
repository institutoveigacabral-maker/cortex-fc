import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserNotifications } from "@/db/queries"
import { NotificationCenter } from "./NotificationCenter"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const notifications = await getUserNotifications(session.user.id as string, {
    limit: 100,
  })

  const serialized = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body ?? "",
    read: !!n.readAt,
    entityType: n.entityType ?? undefined,
    entityId: n.entityId ?? undefined,
    createdAt: n.createdAt.toISOString(),
  }))

  return <NotificationCenter initialNotifications={serialized} />
}
