import { createNotification, getOrgMembers } from "@/db/queries"

/**
 * Send notification to a specific user
 */
export async function notifyUser(params: {
  userId: string
  orgId: string
  type: string
  title: string
  body: string
  entityType?: string
  entityId?: string
}) {
  return createNotification(params)
}

/**
 * Send notification to all org members with a specific role.
 * If roles is omitted, notifies everyone.
 */
export async function notifyTeam(params: {
  orgId: string
  type: string
  title: string
  body: string
  entityType?: string
  entityId?: string
  roles?: string[]
}) {
  const members = await getOrgMembers(params.orgId)
  const filtered = params.roles
    ? members.filter((m) => params.roles!.includes(m.role))
    : members

  await Promise.all(
    filtered.map((member) =>
      createNotification({
        userId: member.userId,
        orgId: params.orgId,
        type: params.type,
        title: params.title,
        body: params.body,
        entityType: params.entityType,
        entityId: params.entityId,
      })
    )
  )
}

/**
 * Parse @mentions from text and notify mentioned users.
 * Matches by userName or email prefix (case-insensitive).
 */
export async function notifyMentions(params: {
  text: string
  orgId: string
  fromUserName: string
  entityType: string
  entityId: string
}) {
  const mentionPattern = /@(\S+)/g
  const mentions = [...params.text.matchAll(mentionPattern)].map((m) => m[1])
  if (mentions.length === 0) return

  const members = await getOrgMembers(params.orgId)

  for (const mention of mentions) {
    const member = members.find(
      (m) =>
        m.userName?.toLowerCase() === mention.toLowerCase() ||
        m.userEmail?.toLowerCase().startsWith(mention.toLowerCase())
    )
    if (member) {
      await createNotification({
        userId: member.userId,
        orgId: params.orgId,
        type: "mention",
        title: `${params.fromUserName} mencionou voce`,
        body: params.text.slice(0, 200),
        entityType: params.entityType,
        entityId: params.entityId,
      })
    }
  }
}
