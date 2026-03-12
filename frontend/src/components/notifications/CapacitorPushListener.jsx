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
            try {
                // Remove existing listeners before adding new ones to avoid duplicates
                await PushNotifications.removeAllListeners();
            } catch (e) {
                console.warn('[GynSysDebug] Could not remove listeners (Plugin not ready or web context):', e);
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

            // Initial registration attempt if already enabled OR user is logged in
            const { user: initialUser, cycleUser: initialCycleUser } = useAuthStore.getState();
            const hasExplicitConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
            const initialAuth = !!(initialUser || initialCycleUser);

            if (hasExplicitConsent || initialAuth) {
                console.log('[GynSysPush] Attempting initial registration (Auth:', initialAuth, ')');
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

    // --- 3. REMOTE LOGGING FOR DEBUGGING ---
    const remoteLog = (msg) => {
        console.log(msg);
        axios.post('/notifications/track', { 
            notification_id: 0, 
            event: 'debug', 
            metadata: { message: msg, ua: navigator.userAgent } 
        }).catch(() => {});
    };

    return null;
};
