import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Automatically handled by vite-plugin-pwa during build
// This MUST appear exactly ONCE
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Allow the service worker to take control of the page immediately
self.skipWaiting();
clientsClaim();

// --- Push Notification Logic ---

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || "GynSys Notification";
        const options = {
            body: data.body || "Tienes una nueva notificación.",
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error('Error processing push notification:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
