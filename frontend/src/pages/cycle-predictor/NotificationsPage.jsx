import CycleSettingsTab from '../../components/cycle-predictor/CycleSettingsTab';

/**
 * NotificationsPage - Notification settings and preferences
 */
export default function NotificationsPage() {
    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    🔔 Notificaciones
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configura tus alertas y recordatorios
                </p>
            </div>

            {/* Settings Content */}
            <CycleSettingsTab />
        </div>
    );
}
