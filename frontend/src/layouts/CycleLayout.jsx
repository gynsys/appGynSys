import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, User, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
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
    const tenantPrimaryColor = localStorage.getItem('tenant_theme_primary') || '#ec4899';
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
                    {/* Empty left space to replace the Back Button */}
                    <div className="w-8"></div>

                    {/* Title (left mostly empty for native feel) */}
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                        {activePregnancy ? 'Asistente Prenatal' : ''}
                    </h1>

                    {/* User Avatar with Logout Popover */}
                    {isCycleAuthenticated ? (
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
                    ) : (
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer bg-gray-100 dark:bg-gray-800"
                            onClick={() => setIsLoginModalOpen(true)}
                        >
                            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                    )}
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


