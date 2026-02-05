import React from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export const PushToggle = () => {
    const { isSubscribed, subscribeToPush, unsubscribeFromPush, loading, error, permission } = usePushNotifications();

    const handleToggle = async (checked) => {
        if (checked) {
            await subscribeToPush();
        } else {
            await unsubscribeFromPush();
        }
    };

    const isDisabled = loading || permission === 'denied';

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                        isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Notificaciones Push</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {permission === 'denied' ? 'Bloqueadas por el navegador' :
                            isSubscribed ? 'Activadas en este dispositivo' : 'Recibe alertas en tu dispositivo'}
                    </p>
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
            </div>

            <Switch
                checked={isSubscribed}
                onCheckedChange={handleToggle}
                disabled={isDisabled}
            />
        </div>
    );
};
