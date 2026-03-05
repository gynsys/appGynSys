import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export default function PushSubscriptionWidget({ primaryColor = '#4F46E5' }) {
    const { isSubscribed, subscribeToPush, unsubscribeFromPush, loading, error } = usePushNotifications();

    const handleToggle = async () => {
        if (isSubscribed) {
            const confirmed = window.confirm("¿Deseas desactivar las notificaciones en este dispositivo?");
            if (confirmed) {
                await unsubscribeFromPush();
                toast.success("Notificaciones desactivadas");
            }
        } else {
            const success = await subscribeToPush();
            if (success) {
                toast.success("¡Notificaciones activadas!", {
                    description: "Recibirás recordatorios de tus citas 1h 30m antes."
                });
            } else {
                toast.error("Error al activar notificaciones", {
                    description: "Asegúrate de permitir los permisos en tu navegador."
                });
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-all duration-200">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        {isSubscribed ? (
                            <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <BellOff className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {isSubscribed ? 'Notificaciones Activas' : 'Notificaciones Desactivadas'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isSubscribed
                                ? 'Recibirás avisos 90 min antes de cada cita.'
                                : 'Actívalas para recibir recordatorios en tu móvil.'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all transform active:scale-95 flex items-center gap-2 ${isSubscribed
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            : 'text-white shadow-lg'
                        }`}
                    style={!isSubscribed ? { backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` } : {}}
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSubscribed ? (
                        'Desactivar'
                    ) : (
                        'Activar en este móvil'
                    )}
                </button>
            </div>

            {error && (
                <p className="mt-2 text-[10px] text-red-500 font-medium animate-pulse">
                    ⚠️ {error}
                </p>
            )}
        </div>
    );
}
