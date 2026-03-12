import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { isCapacitor } from '@/utils/platform';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export const CapacitorPushListener = () => {
    useEffect(() => {
        if (!isCapacitor()) return;

        // --- 1. SET UP LISTENERS ---

        // On successful registration, send token to backend
        PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token:', token.value);
            
            // Only send if the user has opted-in via the UI
            const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
            if (hasExplicitConsent) {
                axios.post('/notifications/subscribe', { token: token.value })
                    .then(() => console.log('Native token synced with backend'))
                    .catch(err => console.error('Error syncing native token:', err));
            }
        });

        // Handle registration errors
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error:', JSON.stringify(error));
        });

        // Handle notification reception while app is in FOREGROUND
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received in foreground:', notification);
            
            // Show a toast since the OS doesn't show native banner in foreground by default
            toast((t) => (
                <div className="flex flex-col">
                    <span className="font-bold">{notification.title}</span>
                    <span className="text-sm">{notification.body}</span>
                </div>
            ), {
                duration: 5000,
                position: 'top-right',
                icon: '🔔'
            });
        });

        // Handle action performed (click on notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push notification action performed:', notification);
            const data = notification.notification.data;
            if (data?.url) {
                // Use window.location or navigate if using router
                window.location.href = data.url;
            }
        });

        // --- 2. INITIAL REGISTRATION ATTEMPT ---
        // If the user already enabled push, we try to register on every app start 
        // to ensure the token is fresh in the backend.
        const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
        if (hasExplicitConsent) {
            PushNotifications.checkPermissions().then((res) => {
                if (res.receive === 'granted') {
                    PushNotifications.register();
                }
            });
        }

    // --- 3. RE-REGISTER ON LOGIN ---
    // Listen for user changes to trigger registration immediately after login
    const { user, cycleUser } = useAuthStore();
    useEffect(() => {
        const activeUser = user || cycleUser;
        if (activeUser && isCapacitor()) {
            console.log('User change detected, checking/requesting push permissions...');
            PushNotifications.checkPermissions().then((res) => {
                if (res.receive === 'granted') {
                    PushNotifications.register();
                } else if (res.receive === 'prompt') {
                    PushNotifications.requestPermissions().then((res) => {
                        if (res.receive === 'granted') {
                            PushNotifications.register();
                        }
                    });
                }
            });
        }
    }, [user, cycleUser]);

    return () => {
        PushNotifications.removeAllListeners();
    };
}, [user, cycleUser]);

    return null; // This component doesn't render anything
};
