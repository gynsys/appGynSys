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

    // Attempt to focus an existing window or open a new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            const urlToOpen = event.notification.data.url || '/';

            // Check if there is already a window of this app open
            for (let client of windowClients) {
                // If it matches or is part of the same domain, focus it
                if (client.url.includes(location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
