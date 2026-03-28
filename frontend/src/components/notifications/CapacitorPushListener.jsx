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
                // Failsafe: Double check if plugin is actually available to avoid "plugin not implemented"
                if (!PushNotifications) return;
                await PushNotifications.removeAllListeners();
            } catch (e) {
                // Silence this specific error on web if environment detection failed
                if (e.message?.includes('not implemented')) return;
                remoteLog(`[GynSysPush] Warning: Could not initialize listeners: ${e.message}`);
            }

            try {
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
                                // Guardamos el token por si el usuario cambia de sesión sin reiniciar la app
                                localStorage.setItem('capacitor_push_token', tokenValue);
                            })
                            .catch(err => {
                                const errorDetail = err?.response?.data || err.message;
                                remoteLog(`[GynSysPush] Error syncing native token: ${JSON.stringify(errorDetail)}`);
                            });
                    } else {
                        // Guardamos el token igual aunque no esté autenticado para usarlo al hacer login
                        localStorage.setItem('capacitor_push_token', tokenValue);
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
            } catch (e) {
                if (!e.message?.includes('not implemented')) {
                    remoteLog(`[GynSysPush] Error setting up listeners: ${e.message}`);
                }
            }
        };

        setupListeners();

        return () => {
            if (isCapacitor()) {
                try {
                    PushNotifications.removeAllListeners();
                } catch (e) {}
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
            try {
                // Sincronización proactiva del token usando el token guardado en caso de swap de cuentas
                const savedToken = localStorage.getItem('capacitor_push_token');
                if (savedToken) {
                    remoteLog(`[GynSysPush] Proactive sync of saved token on login...`);
                    axios.post('/notifications/subscribe', { token: savedToken }).catch(() => {});
                }

                PushNotifications.checkPermissions().then((res) => {
                    remoteLog(`[GynSysPush] Permission result: ${res.receive}`);
                    if (res.receive === 'granted') {
                        remoteLog(`[GynSysPush] Calling register()...`);
                        PushNotifications.register().catch(() => {});
                    } else if (res.receive === 'prompt') {
                        remoteLog(`[GynSysPush] Requesting permissions...`);
                        PushNotifications.requestPermissions().then((res) => {
                            remoteLog(`[GynSysPush] Request result: ${res.receive}`);
                            if (res.receive === 'granted') PushNotifications.register().catch(() => {});
                        });
                    } else {
                        remoteLog(`[GynSysPush] Permissions DENIED or restricted: ${res.receive}`);
                    }
                }).catch(() => {});
            } catch (e) {
                if (!e.message?.includes('not implemented')) {
                    remoteLog(`[GynSysPush] Error checking permissions: ${e.message}`);
                }
            }
        } else {
            // --- PWA AUTO-REGISTRATION ---
            // Solo sincronizamos automáticamente si:
            // 1. Hay permiso del navegador.
            // 2. El usuario ha dado consentimiento explícito antes (localStorage).
            // Esto evita que dispositivos borrados manualmente desde la DB o Admin
            // "revivan" infinitamente solo por entrar a la web si ya no se desea push ahí.
            const hasConsent = localStorage.getItem('gynsys_push_enabled') === 'true';
            
            if ("Notification" in window && Notification.permission === "granted" && hasConsent) {
                console.log("[GynSysPush] PWA Permission and Consent active. Syncing subscription...");
                pushService.subscribeUser().catch(err => {
                    console.error("[GynSysPush] PWA Auto-sync failed:", err);
                });
            }
        }
    }, [user, cycleUser]);

    return null;
};
