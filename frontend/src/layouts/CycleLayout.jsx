import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { BottomNav } from '../components/common/BottomNav';
import CycleAuthDialog from '../components/cycle-predictor/CycleAuthDialog';
import DownloadCTADialog from '../components/cycle-predictor/DownloadCTADialog';
import { isCapacitor } from '../utils/platform';
import cycleService from '../services/cycleService';

/**
 * CycleLayout - Auth-protected layout for Cycle Predictor PWA
 * Provides header, bottom navigation, and authentication guard
 */
export default function CycleLayout() {
    const { isCycleAuthenticated, cycleUser } = useAuthStore();
    const tenantPrimaryColor = localStorage.getItem('tenant_theme_primary') || '#ec4899';
    
    // Manejar Popup CTA
    const [showCTADialog, setShowCTADialog] = useState(false);

    useEffect(() => {
        if (!isCycleAuthenticated && !isCapacitor()) {
            const hasSeen = localStorage.getItem('has_seen_app_cta');
            
            // Check if we need to show it
            let shouldShow = false;
            if (!hasSeen) {
                shouldShow = true;
            } else if (hasSeen !== 'installed' && hasSeen !== 'registered') {
                // If it's a timestamp, check if 15 days have passed
                const timestamp = parseInt(hasSeen, 10);
                if (!isNaN(timestamp)) {
                    const daysPassed = (new Date().getTime() - timestamp) / (1000 * 3600 * 24);
                    if (daysPassed > 15) shouldShow = true;
                }
            }

            if (shouldShow) {
                const timer = setTimeout(() => {
                    setShowCTADialog(true);
                }, 7000);
                return () => clearTimeout(timer);
            }
        }
    }, [isCycleAuthenticated]);

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
            {/* Page Content */}
            <main className="max-w-4xl mx-auto pt-6">
                <Outlet context={{ openLogin: () => setIsLoginModalOpen(true) }} />
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <BottomNav items={navItems} theme="#ec4899" />

            <CycleAuthDialog
                open={isLoginModalOpen}
                onOpenChange={setIsLoginModalOpen}
                initialView="login"
            />

            <DownloadCTADialog 
                open={showCTADialog}
                onOpenChange={setShowCTADialog}
                onRegisterClick={() => setIsLoginModalOpen(true)}
            />
        </div>
    );
}


