import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { isCapacitor } from '@/utils/platform';
import { PushNotifications } from '@capacitor/push-notifications';

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
    const [permission, setPermission] = useState('prompt');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (isCapacitor()) {
            try {
                const permStatus = await PushNotifications.checkPermissions();
                setPermission(permStatus.receive);
                
                // Note: In Capacitor, "isSubscribed" is mainly local state 
                // since the token registration happens on every app launch in a robust app
                const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
                setIsSubscribed(hasExplicitConsent && permStatus.receive === 'granted');
            } catch (e) {
                console.warn("Capacitor checkPermissions not available on this platform", e);
            }
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            // If we are in Capacitor, we don't need Service Workers for Push, so we don't error out
            if (isCapacitor()) {
                console.log('[GynSysDebug] Skipping SW check because we are in Native environment');
                return;
            }
            setError("Push notifications not supported");
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
        
        setIsSubscribed(!!subscription && hasExplicitConsent);
        setPermission(Notification.permission);
    };

    const subscribeToPush = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isCapacitor()) {
                // 1. Request Permission
                try {
                    let permStatus = await PushNotifications.requestPermissions();
                    setPermission(permStatus.receive);
                    if (permStatus.receive !== 'granted') throw new Error("Permission not granted");

                    // 2. Set intent/consent BEFORE registering so the listener catches it
                    localStorage.setItem('gynsys_push_enabled', 'true');

                    // 3. Register for Push
                    await PushNotifications.register();
                    setIsSubscribed(true);
                    return true;
                } catch (e) {
                    if (e.message?.includes('not implemented')) {
                        setError("Notificaciones nativas no disponibles en navegador");
                    } else {
                        setError(e.message);
                    }
                    return false;
                }
            }

            // --- WEB PWA FLOW ---
            if (permission === 'denied') {
                throw new Error("Notifications blocked by browser");
            }

            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') throw new Error("Permission not granted");

            const { data } = await axios.get('/notifications/vapid-public-key');
            if (!data.public_key) throw new Error("Server VAPID key missing");

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.public_key)
            });

            await axios.post('/notifications/subscribe', subscription.toJSON());

            localStorage.setItem('gynsys_push_enabled', 'true');
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
            if (isCapacitor()) {
                // native unregister
                try {
                    await PushNotifications.removeAllListeners();
                } catch (e) { console.warn("Native removeAllListeners failed", e); }
                // Optionally call backend to delete token
                // ...
            } else {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    try {
                        await axios.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
                    } catch (e) { console.warn("Backend unsubscribe failed", e); }
                    await subscription.unsubscribe();
                }
            }
            
            localStorage.removeItem('gynsys_push_enabled');
            setIsSubscribed(false);
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
