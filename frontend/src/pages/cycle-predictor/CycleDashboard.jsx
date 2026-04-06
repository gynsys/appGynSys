import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, TrendingUp, Bell, Baby, Loader2 } from 'lucide-react';
import { isCapacitor } from '../../utils/platform';
import { useAuthStore } from '../../store/authStore';
import cycleService from '../../services/cycleService';
import CycleDashboardTab from '../../components/cycle-predictor/CycleDashboardTab';
import PregnancyDashboard from '../../components/cycle-predictor/PregnancyDashboard';
import Button from '../../components/common/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { LogOut, User } from 'lucide-react';

/**
 * CycleDashboard - Main dashboard page for Cycle Predictor
 * Shows pregnancy dashboard if active, otherwise shows cycle dashboard
 */
export default function CycleDashboard() {
    const { cycleUser, isCycleAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [activePregnancy, setActivePregnancy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [endLoading, setEndLoading] = useState(false);
    const tenantPrimaryColor = localStorage.getItem('tenant_theme_primary') || '#ec4899';
    
    // Add a state to know if this is the very first time the app is loading
    const [isInitialBoot] = useState(() => {
        if (!window.__gynsys_has_booted) {
             window.__gynsys_has_booted = true;
             return true;
        }
        return false;
    });

    useEffect(() => {
        if (isCycleAuthenticated) {
            checkPregnancyStatus();
        } else {
            setLoading(false);
        }
    }, [isCycleAuthenticated]);

    const checkPregnancyStatus = async () => {
        if (!isCycleAuthenticated) return;
        try {
            const preg = await cycleService.getActivePregnancy();
            setActivePregnancy(preg);
        } catch (e) {
            console.error('Error checking pregnancy status:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmEndPregnancy = async () => {
        try {
            setEndLoading(true);
            await cycleService.endPregnancy();
            await checkPregnancyStatus();
            setShowEndDialog(false);
        } catch (error) {
            console.error(error);
        } finally {
            setEndLoading(false);
        }
    };

    if (loading) {
        if (isCapacitor() && isInitialBoot) {
            return <div className="min-h-[60vh] bg-transparent" />;
        }
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            {/* Welcome Header */}
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {activePregnancy ? '🤰 Mi Embarazo' : '💗 Mi Ciclo'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cycleUser?.nombre_completo || cycleUser?.name ? `Hola, ${(cycleUser.nombre_completo || cycleUser.name).split(' ')[0]}` : 'Hola'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {activePregnancy && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-7 px-3 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/40 flex items-center justify-center"
                            onClick={() => setShowEndDialog(true)}
                        >
                            <span className="leading-none mt-0.5">Finalizar</span>
                        </Button>
                    )}

                    {isCycleAuthenticated && (
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900" style={{ backgroundColor: `${tenantPrimaryColor}20`, color: tenantPrimaryColor }}>
                                        <span className="text-sm font-bold" style={{ color: 'inherit' }}>
                                            {(cycleUser?.nombre_completo || cycleUser?.name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-56 p-2 rounded-xl">
                                    <div className="px-2 py-2 border-b dark:border-gray-700 mb-1">
                                        <p className="text-sm font-medium leading-none text-gray-900 dark:text-white truncate">
                                            {cycleUser?.nombre_completo || cycleUser?.name || "Usuaria"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                            {cycleUser?.email}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            useAuthStore.getState().logoutPatient();
                                            navigate('/login');
                                        }}
                                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar sesión
                                    </button>
                                </PopoverContent>
                            </Popover>

                            <button 
                                onClick={() => {
                                    useAuthStore.getState().logoutPatient();
                                    navigate('/login');
                                }}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                title="Cerrar sesión"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Dashboard Content */}
            {activePregnancy ? (
                <PregnancyDashboard
                    activePregnancy={activePregnancy}
                    onStatusChange={checkPregnancyStatus}
                />
            ) : (
                <CycleDashboardTab onPregnancyChange={checkPregnancyStatus} />
            )}

            {/* End Pregnancy Confirmation Dialog */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Finalizar seguimiento de embarazo?</DialogTitle>
                        <DialogDescription>
                            Esta acción marcará tu embarazo actual como finalizado y volverás al modo de seguimiento de ciclo menstrual. No se borrarán tus registros anteriores.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowEndDialog(false)}
                            disabled={endLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmEndPregnancy}
                            disabled={endLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {endLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
