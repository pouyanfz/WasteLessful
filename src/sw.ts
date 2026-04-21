/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

declare const self: ServiceWorkerGlobalScope

// Take control of all clients immediately on activation
self.skipWaiting()
clientsClaim()

// Workbox precaching — vite-plugin-pwa injects the manifest here
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ── FCM background message handler ────────────────────────────────────────────
// Handles notifications when the app is closed / in the background.
const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

const messagingInstance = getMessaging(firebaseApp)

onBackgroundMessage(messagingInstance, (payload) => {
  const title = payload.notification?.title ?? 'Wastelessful'
  const body = payload.notification?.body ?? ''

  self.registration.showNotification(title, {
    body,
    icon: '/appIcon.png',
    badge: '/appIcon-192.png',
    tag: 'wastelessful',
    data: payload.data,
  })
})
