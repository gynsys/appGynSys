import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { isCapacitor } from '@/utils/platform';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import pushService from '@/services/pushService';

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
        // Immediate ping to verify component is alive and executing
        axios.post('/notifications/track', { 
            notification_id: 0, 
            event: 'debug', 
            metadata: { 
                message: 'NOTIF_MANAGER_MOUNTED', 
                isCapacitor: isCapacitor(),
                userAgent: navigator.userAgent
            } 
        }).catch(() => {});

        if (!isCapacitor()) return;
        
        // --- NATIVE CAPACITOR LOGIC ---
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
                const isAuthenticated = !!(user || cycleUser);

                if (isAuthenticated) {
                    remoteLog(`[GynSysPush] Syncing native token to backend...`);
                    axios.post('/notifications/subscribe', { token: tokenValue })
                        .then(() => {
                            remoteLog('[GynSysPush] Native token synced successfully');
                        })
                        .catch(err => {
                            const errorDetail = err?.response?.data || err.message;
                            remoteLog(`[GynSysPush] Error syncing native token: ${JSON.stringify(errorDetail)}`);
                        });
                } else {
                    remoteLog(`[GynSysPush] Registration success but NOT authenticated yet`);
                }
            });

            PushNotifications.addListener('registrationError', (error) => {
                remoteLog(`[GynSysPush] Registration error: ${JSON.stringify(error)}`);
            });

            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                remoteLog(`[GynSysPush] Notification received: ${notification.title}`);
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
            if (isCapacitor()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, []);

    // --- RE-REGISTER ON AUTH CHANGE (Both Capacitor and PWA) ---
    const { user, cycleUser } = useAuthStore();
    useEffect(() => {
        const activeUser = user || cycleUser;
        if (!activeUser) return;

        if (isCapacitor()) {
            remoteLog(`[GynSysPush] Checking Native permissions...`);
            PushNotifications.checkPermissions().then((res) => {
                remoteLog(`[GynSysPush] Permission result: ${res.receive}`);
                if (res.receive === 'granted') {
                    remoteLog(`[GynSysPush] Calling register()...`);
                    PushNotifications.register();
                } else if (res.receive === 'prompt') {
                    remoteLog(`[GynSysPush] Requesting permissions...`);
                    PushNotifications.requestPermissions().then((res) => {
                        remoteLog(`[GynSysPush] Request result: ${res.receive}`);
                        if (res.receive === 'granted') PushNotifications.register();
                    });
                } else {
                    remoteLog(`[GynSysPush] Permissions DENIED or restricted: ${res.receive}`);
                }
            });
        } else {
            // --- PWA AUTO-REGISTRATION ---
            // If already permitted, subscribe silently to sync with backend
            if ("Notification" in window && Notification.permission === "granted") {
                console.log("[GynSysPush] PWA Permission already granted. Syncing subscription...");
                pushService.subscribeUser().catch(err => {
                    console.error("[GynSysPush] PWA Auto-sync failed:", err);
                });
            }
        }
    }, [user, cycleUser]);

    return null;
};
