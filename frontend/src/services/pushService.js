import api from '../lib/axios';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const pushService = {
    getVapidKey: async () => {
        const response = await api.get('/notifications/vapid-public-key');
        return response.data.public_key;
    },

    subscribeUser: async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error("Push notifications not supported");
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = await pushService.getVapidKey();

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Send to backend
            // subscription object has endpoint and keys
            const payload = subscription.toJSON();

            // Ensure keys object matches backend schema (p256dh, auth)
            // Subscription.toJSON().keys usually has them.

            await api.post('/notifications/subscribe', {
                endpoint: payload.endpoint,
                keys: payload.keys,
                expirationTime: payload.expirationTime
            });

            return true;
        } catch (e) {
            console.error("Push subscription failed", e);
            throw e;
        }
    },

    unsubscribeUser: async () => {
        // Logic to unsubscribe from SW and Backend
        // For now just backend
        await api.post('/notifications/unsubscribe');
    }
};

export default pushService;
