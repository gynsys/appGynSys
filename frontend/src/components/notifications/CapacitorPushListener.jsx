import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { isCapacitor } from '@/utils/platform';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export const CapacitorPushListener = () => {
    useEffect(() => {
        if (!isCapacitor()) return;

        const setupListeners = async () => {
            // Remove existing listeners before adding new ones to avoid duplicates
            await PushNotifications.removeAllListeners();

            PushNotifications.addListener('registration', (token) => {
                console.log('Push registration success, token:', token.value);
                // When coming from "Vincular" button or auto-login, we send the token
                // We check the intent stored in localStorage
                const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
                if (hasExplicitConsent) {
                    axios.post('/notifications/subscribe', { token: token.value })
                        .then(() => console.log('Native token synced with backend'))
                        .catch(err => console.error('Error syncing native token:', err));
                }
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.error('Push registration error:', JSON.stringify(error));
            });

            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                toast((t) => (
                    <div className="flex flex-col">
                        <span className="font-bold">{notification.title}</span>
                        <span className="text-sm">{notification.body}</span>
                    </div>
                ), { duration: 5000, position: 'top-right', icon: '🔔' });
            });

            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                const data = notification.notification.data;
                if (data?.url) window.location.href = data.url;
            });

            // Initial registration attempt if already enabled
            const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
            if (hasExplicitConsent) {
                const res = await PushNotifications.checkPermissions();
                if (res.receive === 'granted') {
                    await PushNotifications.register();
                }
            }
        };

        setupListeners();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, []);

    // --- 2. RE-REGISTER ON LOGIN ---
    const { user, cycleUser } = useAuthStore();
    useEffect(() => {
        const activeUser = user || cycleUser;
        if (activeUser && isCapacitor()) {
            console.log('User change detected, checking push permissions...');
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

    return null; // This component doesn't render anything
};
