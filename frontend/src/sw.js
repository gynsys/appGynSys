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
            icon: data.icon || '/pwa-512x512.png',
            badge: data.badge || '/pwa-192x192.png', // Badge usually needs to be smaller
            image: data.image || null,
            vibrate: [200, 100, 200],
            tag: data.tag || 'gynsys-msg',
            renotify: true,
            data: {
                url: data.url || '/cycle/dashboard'
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
            const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

            // Check if there is already a window of this app open
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    // Navigate to the specific URL if it's different and focus
                    if (client.url !== urlToOpen && 'navigate' in client) {
                        client.navigate(urlToOpen);
                    }
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
