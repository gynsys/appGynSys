import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

const urlBase64ToUint8Array = (base64String) => {
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
};

export const usePushNotifications = () => {
    const [permission, setPermission] = useState(Notification.permission);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setError("Push notifications not supported");
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setPermission(Notification.permission);
    };

    const subscribeToPush = async () => {
        setLoading(true);
        setError(null);
        try {
            if (permission === 'denied') {
                throw new Error("Notifications blocked by browser");
            }

            // 1. Request Permission
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') throw new Error("Permission not granted");

            // 2. Get VAPID Key
            const { data } = await axios.get('/notifications/vapid-public-key');
            if (!data.public_key) throw new Error("Server VAPID key missing");

            // 3. Subscribe in Browser
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.public_key)
            });

            // 4. Send to Backend
            await axios.post('/notifications/subscribe', subscription.toJSON());

            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error("Push Subscribe Error:", err);
            setError(err.response?.data?.detail || err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from Backend first (best effort)
                try {
                    await axios.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
                } catch (e) { console.warn("Backend unsubscribe failed", e); }

                // Unsubscribe from Browser
                await subscription.unsubscribe();
                setIsSubscribed(false);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        permission,
        isSubscribed,
        loading,
        error,
        subscribeToPush,
        unsubscribeFromPush
    };
};
