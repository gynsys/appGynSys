import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, TrendingUp, Bell, Baby } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import cycleService from '../../services/cycleService';
import CycleDashboardTab from '../../components/cycle-predictor/CycleDashboardTab';
import PregnancyDashboard from '../../components/cycle-predictor/PregnancyDashboard';

/**
 * CycleDashboard - Main dashboard page for Cycle Predictor
 * Shows pregnancy dashboard if active, otherwise shows cycle dashboard
 */
export default function CycleDashboard() {
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [activePregnancy, setActivePregnancy] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            checkPregnancyStatus();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const checkPregnancyStatus = async () => {
        if (!isAuthenticated) return;
        try {
            const preg = await cycleService.getActivePregnancy();
            setActivePregnancy(preg);
        } catch (e) {
            console.error('Error checking pregnancy status:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            {/* Welcome Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {activePregnancy ? '🤰 Mi Embarazo' : '💗 Mi Ciclo'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.name ? `Hola, ${user.name.split(' ')[0]}` : 'Hola'}
                </p>
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
        </div>
    );
}
