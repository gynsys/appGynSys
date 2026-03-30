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
        if (isCapacitor()) {
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
