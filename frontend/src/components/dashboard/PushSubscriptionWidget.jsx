import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

// Helper for transparency
const hexToRgba = (hex, alpha) => {
  try {
    if (!hex || hex === 'transparent') return 'transparent';
    let r, g, b;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex.slice(0, 1).repeat(2), 16);
      g = parseInt(cleanHex.slice(1, 2).repeat(2), 16);
      b = parseInt(cleanHex.slice(2, 3).repeat(2), 16);
    } else {
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return hex;
  }
};

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
        <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 p-5 transition-all duration-300 active:scale-[0.99]"
            style={{ 
                borderColor: hexToRgba(primaryColor, 0.1),
                boxShadow: `0 20px 25px -5px ${hexToRgba(primaryColor, 0.05)}, 0 10px 10px -5px ${hexToRgba(primaryColor, 0.02)}`
            }}
        >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all duration-500 ${isSubscribed ? 'bg-green-50 dark:bg-green-900/20 rotate-0' : 'bg-gray-50 dark:bg-gray-700 -rotate-12'}`}>
                        {isSubscribed ? (
                            <Bell className="w-6 h-6 text-green-600 dark:text-green-400 animate-bounce-slow" />
                        ) : (
                            <BellOff className="w-6 h-6 text-gray-400" />
                        )}
                    </div>
                    <div className="text-center sm:text-left">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                            {isSubscribed ? 'Notificaciones Vinculadas' : 'Dispositivo no Vinculado'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px]">
                            {isSubscribed
                                ? 'Este móvil recibirá avisos de tus citas en tiempo real.'
                                : 'Actívalas en este dispositivo para recibir alertas push.'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 min-w-[160px] ${isSubscribed
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            : 'text-white shadow-lg'
                        }`}
                    style={!isSubscribed ? { 
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                        boxShadow: `0 10px 15px -3px ${hexToRgba(primaryColor, 0.3)}`
                    } : {}}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isSubscribed ? (
                        'Desvincular móvil'
                    ) : (
                        'Vincular este móvil'
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                        <span className="text-base">⚠️</span> {error}
                    </p>
                </div>
            )}
        </div>
    );
}
