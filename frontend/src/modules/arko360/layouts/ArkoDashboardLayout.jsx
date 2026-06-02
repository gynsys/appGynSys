import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { FiHome, FiSettings, FiLayout, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuthStore } from '../../../store/authStore';

export const ArkoDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    // Implement arko logout here if different, or just remove token
    localStorage.removeItem('arko_token');
    navigate('/arko-admin/login');
  };

  const navItems = [
    { name: 'Mi Perfil', path: '/arko-admin/dashboard/profile', icon: <FiSettings className="w-5 h-5" /> },
    { name: 'Gestión del Blog', path: '/arko-admin/dashboard/blog', icon: <FiLayout className="w-5 h-5" /> },
    { name: 'Herramientas', path: '/arko-admin/dashboard/tools', icon: <FiHome className="w-5 h-5" /> },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
          <div className="font-bold text-xl text-gray-800 dark:text-white">Arko 360 Admin</div>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
           >
             <FiLogOut />
             <span className="hidden sm:inline">Cerrar Sesión</span>
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside 
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed md:relative z-10 w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
            transition-transform duration-300 ease-in-out flex flex-col
          `}
        >
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                    ${isActive 
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900/50 z-0 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-all duration-300">
          <Outlet context={{ isSidebarOpen }} />
        </main>
      </div>
    </div>
  );
};
