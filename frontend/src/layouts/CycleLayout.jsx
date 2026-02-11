import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { BottomNav } from '../components/common/BottomNav';
import CycleAuthDialog from '../components/cycle-predictor/CycleAuthDialog';

/**
 * CycleLayout - Auth-protected layout for Cycle Predictor PWA
 * Provides header, bottom navigation, and authentication guard
 */
export default function CycleLayout() {
    const { isAuthenticated, user } = useAuthStore();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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
            className="min-h-screen bg-gray-50 dark:bg-gray-950 md:pb-0"
            style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
            {/* Mobile Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden">
                <div className="flex items-center justify-between px-4 h-14">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                        aria-label="Volver al inicio"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Title */}
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                        Predictor de Ciclos
                    </h1>

                    {/* User Avatar */}
                    {/* User Avatar or Login Action */}
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isAuthenticated ? 'bg-pink-100 dark:bg-pink-900' : 'bg-gray-100 dark:bg-gray-800'}`}
                        onClick={() => !isAuthenticated && setIsLoginModalOpen(true)}
                    >
                        {isAuthenticated ? (
                            <span className="text-sm font-medium text-pink-600 dark:text-pink-300">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        ) : (
                            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="max-w-7xl mx-auto">
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


