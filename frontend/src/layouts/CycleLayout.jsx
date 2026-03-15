import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { BottomNav } from '../components/common/BottomNav';
import CycleAuthDialog from '../components/cycle-predictor/CycleAuthDialog';
import cycleService from '../services/cycleService';

/**
 * CycleLayout - Auth-protected layout for Cycle Predictor PWA
 * Provides header, bottom navigation, and authentication guard
 */
export default function CycleLayout() {
    const { isCycleAuthenticated, cycleUser } = useAuthStore();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [activePregnancy, setActivePregnancy] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch pregnancy status to adapt header
    useEffect(() => {
        if (isCycleAuthenticated) {
            cycleService.getActivePregnancy()
                .then(preg => setActivePregnancy(preg))
                .catch(e => console.error("Error fetching pregnancy status text", e));
        }
    }, [isCycleAuthenticated, location.pathname]);

    // Authentication Guard
    // Authentication Guard REMOVED to allow guest access
    /*
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem('redirect_after_login', location.pathname);
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);
    */

    // Don't render until auth check completes
    // Don't render until auth check completes - REMOVED for guest access
    // if (!isAuthenticated) {
    //     return null;
    // }

    // Bottom navigation items
    const navItems = [
        {
            icon: <LayoutDashboard className="w-5 h-5" />,
            label: 'Inicio',
            action: () => navigate('/cycle/dashboard'),
            isActive: location.pathname === '/cycle/dashboard'
        },
        {
            icon: <FileText className="w-5 h-5" />,
            label: 'Registros',
            action: () => navigate('/cycle/logs'),
            isActive: location.pathname === '/cycle/logs'
        },
        {
            icon: <Bell className="w-5 h-5" />,
            label: 'Alertas',
            action: () => navigate('/cycle/notifications'),
            isActive: location.pathname === '/cycle/notifications'
        },
        {
            icon: <User className="w-5 h-5" />,
            label: 'Perfil',
            action: () => navigate('/cycle/profile'),
            isActive: location.pathname === '/cycle/profile'
        }
    ];

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-[#030712]"
            style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
            {/* Header - Visible on all screens */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#030712]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                <div className="flex items-center justify-between px-4 h-14">
                    {/* Back Button */}
                    <button
                        onClick={() => {
                            const lastSlug = localStorage.getItem('last_doctor_slug');
                            if (lastSlug) {
                                navigate(`/${lastSlug}`);
                            } else {
                                navigate('/');
                            }
                        }}
                        className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                        aria-label="Volver al inicio"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Title */}
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                        {activePregnancy ? 'Asistente Prenatal' : 'Calculadora Menstrual'}
                    </h1>

                    {/* User Avatar */}
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isCycleAuthenticated ? 'bg-pink-100 dark:bg-pink-900' : 'bg-gray-100 dark:bg-gray-800'}`}
                        onClick={() => !isCycleAuthenticated && setIsLoginModalOpen(true)}
                    >
                        {isCycleAuthenticated ? (
                            <span className="text-sm font-medium text-pink-600 dark:text-pink-300">
                                {cycleUser?.name?.charAt(0).toUpperCase() || cycleUser?.nombre_completo?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        ) : (
                            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="max-w-4xl mx-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <BottomNav items={navItems} theme="#ec4899" />

            <CycleAuthDialog
                open={isLoginModalOpen}
                onOpenChange={setIsLoginModalOpen}
                initialView="login"
            />
        </div>
    );
}


