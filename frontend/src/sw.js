// Use importScripts for workbox in service worker context
// This is automatically handled by vite-plugin-pwa during build
// For dev mode, we'll keep it simple

// --- Precaching Logic (handled by vite-plugin-pwa) ---
if (typeof self.__WB_MANIFEST !== 'undefined') {
    // In production, workbox will be available
    if (typeof workbox !== 'undefined') {
        workbox.precaching.cleanupOutdatedCaches();
        workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
    }
}

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

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
