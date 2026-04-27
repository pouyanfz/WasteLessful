import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { app } from './config'

export { onMessage }

// Lazily initialised — getMessaging() throws in non-browser environments
let _messaging: ReturnType<typeof getMessaging> | null = null
function messaging() {
  if (!_messaging) _messaging = getMessaging(app)
  return _messaging
}

/** Request permission, get an FCM token, and return it (or null on failure). */
export async function requestFcmToken(): Promise<string | null> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.error('VITE_FIREBASE_VAPID_KEY is not set')
    return null
  }

  try {
    // Wait up to 10s for the service worker — in dev mode it may not be
    // registered yet; the timeout prevents the button from hanging forever.
    const sw = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Service worker not ready after 10s')), 10_000),
      ),
    ])
    return await getToken(messaging(), { vapidKey, serviceWorkerRegistration: sw })
  } catch (err) {
    console.error('FCM getToken failed:', err)
    return null
  }
}

/** Returns the current FCM token if permission is already granted, else null. */
export async function getCurrentFcmToken(): Promise<string | null> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return null
  try {
    const sw = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SW timeout')), 10_000),
      ),
    ])
    return await getToken(messaging(), { vapidKey, serviceWorkerRegistration: sw })
  } catch {
    return null
  }
}
