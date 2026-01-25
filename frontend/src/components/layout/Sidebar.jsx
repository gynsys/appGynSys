import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiMapPin, FiClipboard, FiFolder, FiEdit3,
  FiCalendar, FiSettings, FiClock, FiBriefcase,
  FiHome, FiChevronLeft, FiMenu, FiImage, FiHeart, FiStar, FiVideo, FiMessageSquare
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

export const Sidebar = ({ isOpen, toggleSidebar, primaryColor = '#4F46E5', counts = {}, isDarkTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const allMenuItems = [

    { icon: FiSettings, label: 'Mi Perfil', path: '/dashboard/profile' },
    { icon: FiFolder, label: 'Historias Médicas', path: '/dashboard/patients' },
    { icon: FiCalendar, label: 'Gestión Citas', path: '/dashboard/appointments', count: counts.appointments },
    { icon: FiClipboard, label: 'Preconsultas', path: '/dashboard/consultation' },
    { icon: FiMessageSquare, label: 'Chat Pacientes', path: '/dashboard/chat' }, // Explicit link for Chat
    { icon: FiVideo, label: 'Consultas Online (Video)', path: '/dashboard/online-consultations' },
    { icon: FiEdit3, label: 'Gestión Blog', path: '/dashboard/blog' },
    { icon: FiImage, label: 'Gestión Galería', path: '/dashboard/profile/gallery' },
    { icon: FiMapPin, label: 'Ubicaciones', path: '/dashboard/locations' },
    { icon: FiBriefcase, label: 'Servicios', path: '/dashboard/services' },
    { icon: FiStar, label: 'Recomendaciones', path: '/dashboard/recommendations' },
    { icon: FiSettings, label: 'Config. Preconsulta', path: '/dashboard/preconsulta-config' },
    { icon: FiSettings, label: 'Config. PDF', path: '/dashboard/pdf-config' },
  ];

  // Filter menu items based on enabled modules
  const menuItems = allMenuItems.filter(item => {
    if (!item.requiresModule) return true;
    return user?.enabled_modules?.some(m =>
      typeof m === 'string' ? m === item.requiresModule : m.code === item.requiresModule
    );
  });


  const handleNavigation = (path) => {
    navigate(path);
    // User requested NOT to auto-hide sidebar on mobile/tablet
    // "pero en movil y tablet mejor es que no se oculte"
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-30 
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-500 ease-in-out
          transform flex-shrink-0
          ${isOpen
            ? 'translate-x-0 lg:ml-0'
            : '-translate-x-full lg:-ml-64 lg:translate-x-0'
          }
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-700 relative">
            <span className="text-xl font-bold text-gray-800 dark:text-white">Menú</span>
            <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-gray-100 absolute right-4">
              <FiChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    style={isActive ? { color: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`}
                      style={isActive ? { color: primaryColor } : {}}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.count > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer / Version */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-400">GynSys v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
};
