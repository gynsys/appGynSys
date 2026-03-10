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

// --- Tracking Logic ---

const getApiUrl = () => {
    const origin = self.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'http://localhost:8000'; // Local backend default
    }
    // Producción: api.gynsys.net
    return 'https://api.gynsys.net';
};

async function trackEvent(notificationId, eventType) {
    if (!notificationId) return;
    try {
        const apiUrl = getApiUrl();
        await fetch(`${apiUrl}/api/v1/notifications/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notification_id: notificationId,
                event: eventType,
                metadata: {
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            })
        });
    } catch (err) {
        console.error(`Error tracking ${eventType}:`, err);
    }
}

// --- Push Notification Logic ---

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || "GynSys Notification";
        const notificationId = data.notification_id || null;

        const options = {
            body: data.body || "Tienes una nueva notificación.",
            icon: data.icon || '/pwa-512x512.png',
            badge: data.badge || '/pwa-192x192.png',
            image: data.image || null,
            vibrate: [200, 100, 200],
            tag: data.tag || 'gynsys-msg',
            renotify: true,
            data: {
                url: data.url || '/cycle/dashboard',
                notification_id: notificationId
            }
        };

        // Reportar recepción silenciosa al servidor
        if (notificationId) {
            event.waitUntil(trackEvent(notificationId, 'received'));
        }

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error('Error processing push notification:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const notificationId = notification.data ? notification.data.notification_id : null;

    notification.close();

    // Reportar clic al servidor
    if (notificationId) {
        event.waitUntil(trackEvent(notificationId, 'clicked'));
    }

    // Attempt to focus an existing window or open a new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            const urlToOpen = new URL(notification.data.url, self.location.origin).href;

            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    if (client.url !== urlToOpen && 'navigate' in client) {
                        client.navigate(urlToOpen);
                    }
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
