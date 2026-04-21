import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onRequest } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 5 })

// ── Types (mirrors src/types) ─────────────────────────────────────────────────

interface UserSettings {
  notifyDaysBeforeExpiry: number
  notifyOnExpired: boolean
  notifyOnLowQuantity: boolean
  lowQuantityThreshold: number
  notifyUnusedAfterDays: number | null
}

interface UserDoc {
  isAnonymous: boolean
  groupIds: string[]
  fcmTokens?: string[]
  settings: UserSettings
}

interface ItemDoc {
  name: string
  isArchived: boolean
  groupId: string
  quantity: { current: number; initial: number; unit: string }
  dates: {
    expiresAt: FirebaseFirestore.Timestamp | null
    lastUsedAt: FirebaseFirestore.Timestamp | null
  }
  notification: { enabled: boolean }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(ts: FirebaseFirestore.Timestamp): number {
  const ms = ts.toDate().getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

function quantityPct(current: number, initial: number): number {
  if (initial <= 0) return 100
  return (current / initial) * 100
}

// ── Core logic (shared between scheduled + HTTP trigger) ─────────────────────

async function runNotifications() {
  const db = getFirestore()
  const messaging = getMessaging()

  // Get all non-anonymous users who have at least one FCM token
  const usersSnap = await db
    .collection('users')
    .where('isAnonymous', '==', false)
    .get()

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data() as UserDoc
    const tokens = user.fcmTokens ?? []
    if (tokens.length === 0) continue

    const { groupIds, settings } = user
    if (!groupIds.length) continue

    // Firestore 'in' supports up to 30 values; fine for a personal app
    const groupBatch = groupIds.slice(0, 30)

    const itemsSnap = await db
      .collection('items')
      .where('groupId', 'in', groupBatch)
      .where('isArchived', '==', false)
      .get()

    const messages: { title: string; body: string }[] = []

    for (const itemDoc of itemsSnap.docs) {
      const item = itemDoc.data() as ItemDoc
      if (!item.notification.enabled) continue

      const { name, quantity, dates } = item

      // ── Expiry notifications ─────────────────────────────────────────────
      if (dates.expiresAt) {
        const days = daysUntil(dates.expiresAt)

        if (days < 0 && settings.notifyOnExpired) {
          messages.push({
            title: `${name} has expired`,
            body: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago — time to toss or use it.`,
          })
        } else if (days === 0) {
          messages.push({
            title: `${name} expires today!`,
            body: 'Use it today before it goes bad.',
          })
        } else if (days > 0 && days <= settings.notifyDaysBeforeExpiry) {
          messages.push({
            title: `${name} expiring soon`,
            body: `Expires in ${days} day${days === 1 ? '' : 's'}.`,
          })
        }
      }

      // ── Low quantity notifications ────────────────────────────────────────
      if (settings.notifyOnLowQuantity) {
        const pct = quantityPct(quantity.current, quantity.initial)
        if (pct > 0 && pct <= settings.lowQuantityThreshold) {
          messages.push({
            title: `${name} is running low`,
            body: `Only ${quantity.current} ${quantity.unit} remaining (${Math.round(pct)}%).`,
          })
        }
      }

      // ── Unused item notifications ─────────────────────────────────────────
      if (settings.notifyUnusedAfterDays !== null) {
        const lastUsed = dates.lastUsedAt?.toDate() ?? null
        const addedAt = itemDoc.createTime.toDate()
        const referenceDate = lastUsed ?? addedAt
        const daysSince = Math.floor(
          (Date.now() - referenceDate.getTime()) / 86_400_000,
        )
        if (daysSince >= settings.notifyUnusedAfterDays) {
          messages.push({
            title: `${name} hasn't been used`,
            body: `Not used in ${daysSince} days — don't let it go to waste!`,
          })
        }
      }
    }

    if (messages.length === 0) continue

    // Collapse multiple messages into one notification
    let title: string
    let body: string

    if (messages.length === 1) {
      title = messages[0].title
      body = messages[0].body
    } else {
      title = `${messages.length} items need attention`
      body = messages
        .slice(0, 3)
        .map((m) => m.title)
        .join(' · ') + (messages.length > 3 ? ` and ${messages.length - 3} more` : '')
    }

    // Send to all of this user's registered tokens
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          icon: 'https://wastelessful.web.app/appIcon.png',
          badge: 'https://wastelessful.web.app/appIcon-192.png',
        },
        fcmOptions: { link: 'https://wastelessful.web.app' },
      },
    })

    // Remove stale/invalid tokens from the user's doc
    const invalidTokens: string[] = []
    result.responses.forEach((resp, i) => {
      const code = resp.error?.code ?? ''
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[i])
      }
    })

    if (invalidTokens.length > 0) {
      await userDoc.ref.update({
        fcmTokens: FieldValue.arrayRemove(...invalidTokens),
      })
    }
  }
}

// ── Scheduled trigger — 09:00 UTC daily ──────────────────────────────────────

export const dailyNotifications = onSchedule('0 9 * * *', async () => {
  await runNotifications()
})

// ── HTTP trigger — for manual testing only ───────────────────────────────────
// Call: curl -X POST https://<region>-<project>.cloudfunctions.net/triggerNotifications
// Remove this export before going to production if you want.

export const triggerNotifications = onRequest(async (_req, res) => {
  await runNotifications()
  res.json({ ok: true, message: 'Notifications sent' })
})
