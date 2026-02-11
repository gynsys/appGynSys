import { LogOut, User as UserIcon, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import CycleConfigTab from '../../components/cycle-predictor/CycleConfigTab';

/**
 * ProfilePage - User profile, cycle configuration, and account settings
 */
export default function ProfilePage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    ⚙️ Perfil
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configuración y preferencias
                </p>
            </div>

            {/* User Info Card - Only for Authenticated Users */}
            {user && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-pink-600 dark:text-pink-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {user.name || 'Usuario'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                            </p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>
            )}

            {/* Cycle Configuration */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Configuración del Ciclo
                </h3>
                <CycleConfigTab />
            </div>

            {/* Data Management Section (Future) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Gestión de Datos
                </h3>

                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Exportar mis datos
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Próximamente</span>
                    </button>

                    <button className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                        <div className="flex items-center gap-3">
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                Eliminar mi cuenta
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Próximamente</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
