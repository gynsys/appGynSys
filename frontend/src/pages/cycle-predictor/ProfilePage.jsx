import { LogOut, User as UserIcon, Settings, Trash2, Download, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import CycleConfigTab from '../../components/cycle-predictor/CycleConfigTab';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';

/**
 * ProfilePage - User profile, cycle configuration, and account settings
 */
export default function ProfilePage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/compliance/download-my-data');
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `mis_datos_gynsys_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            toast.success('Datos exportados correctamente');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Error al exportar los datos');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await api.delete('/compliance/delete-my-account');
            toast.success('Tu cuenta ha sido eliminada permanentemente');
            logout();
            navigate('/');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.detail || 'Error al eliminar la cuenta');
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
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

            {/* Data Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Gestión de Datos
                </h3>

                <div className="space-y-3">
                    <button
                        onClick={handleExportData}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {isExporting ? 'Exportando...' : 'Exportar mis datos'}
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition text-red-600 dark:text-red-400"
                    >
                        <div className="flex items-center gap-3">
                            <Trash2 className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                Eliminar mi cuenta
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Simple Inline Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-red-900 dark:text-red-100">
                                ¿Estás segura de que quieres eliminar tu cuenta?
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                Esta acción es permanente y borrará todos tus registros de salud, ciclos y síntomas. No se puede deshacer.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                            {isDeleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
