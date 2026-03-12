import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { isCapacitor } from '@/utils/platform';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export const CapacitorPushListener = () => {
    // --- REMOTE LOGGING FOR DEBUGGING ---
    const remoteLog = (msg) => {
        console.log(msg);
        axios.post('/notifications/track', { 
            notification_id: 0, 
            event: 'debug', 
            metadata: { message: msg, ua: navigator.userAgent } 
        }).catch(() => {});
    };

    useEffect(() => {
        if (!isCapacitor()) return;
        remoteLog('[GynSysPush] Native environment detected');

        const setupListeners = async () => {
            try {
                await PushNotifications.removeAllListeners();
            } catch (e) {
                remoteLog(`[GynSysPush] Warning: Could not remove listeners: ${e.message}`);
            }

            PushNotifications.addListener('registration', (token) => {
                const tokenValue = token.value;
                remoteLog(`[GynSysPush] Registration success. Token: ${tokenValue.substring(0, 10)}...`);
                
                const { user, cycleUser } = useAuthStore.getState();
                const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
                const isAuthenticated = !!(user || cycleUser);

                if (hasExplicitConsent || isAuthenticated) {
                    remoteLog(`[GynSysPush] Syncing token (Auth:${isAuthenticated})`);
                    axios.post('/notifications/subscribe', { token: tokenValue })
                        .then(() => {
                            remoteLog('[GynSysPush] Native token synced successfully');
                            if (isAuthenticated && !hasExplicitConsent) {
                                localStorage.setItem('gynsys_push_enabled', 'true');
                            }
                        })
                        .catch(err => {
                            const errorDetail = err?.response?.data || err.message;
                            remoteLog(`[GynSysPush] Error syncing native token: ${JSON.stringify(errorDetail)}`);
                        });
                } else {
                    remoteLog('[GynSysPush] Token received but not synced (No auth/consent)');
                }
            });

            PushNotifications.addListener('registrationError', (error) => {
                remoteLog(`[GynSysPush] Registration error: ${JSON.stringify(error)}`);
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
        };

        setupListeners();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, []);

    // --- RE-REGISTER ON LOGIN/AUTH CHANGE ---
    const { user, cycleUser } = useAuthStore();
    useEffect(() => {
        const activeUser = user || cycleUser;
        if (activeUser && isCapacitor()) {
            remoteLog(`[GynSysPush] User change detected (${activeUser.email}), checking permissions...`);
            PushNotifications.checkPermissions().then((res) => {
                remoteLog(`[GynSysPush] Permissions state: ${res.receive}`);
                if (res.receive === 'granted') {
                    PushNotifications.register();
                } else if (res.receive === 'prompt') {
                    PushNotifications.requestPermissions().then((res) => {
                        remoteLog(`[GynSysPush] Permission request result: ${res.receive}`);
                        if (res.receive === 'granted') {
                            PushNotifications.register();
                        }
                    });
                }
            });
        }
    }, [user, cycleUser]);

    return null;
};
