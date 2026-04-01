import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDashboard, MdLogout, MdHome, MdMenu, MdNotifications } from 'react-icons/md';
import { useAuth } from '../../features/auth/useAuth';
import { getImageUrl } from '../../lib/imageUtils';

export const AdminHeader = ({ showDashboardButton = true, onMenuClick, notificationCount = 0, doctor, isDarkTheme }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Doctor is now passed from parent DashboardLayout

  // Helper for transparency
  const hexToRgba = (hex, alpha) => {
    try {
      if (!hex || hex === 'transparent') return 'transparent';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return hex;
    }
  };

  const primaryColor = doctor?.theme_primary_color || '#4F46E5';

  const handleLogout = () => {
    logout(true); // logout and redirect to login
  };

  if (!doctor) return null;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Name */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset transition-all"
                style={{ '--tw-ring-color': primaryColor }}
              >
                <MdMenu className="h-6 w-6" />
              </button>
            )}
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              {doctor.logo_url ? (
                <img
                  src={getImageUrl(doctor.logo_url)}
                  alt="Logo Clínica"
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center font-black text-lg shadow-inner"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
                >
                  {doctor.nombre_completo?.charAt(0) || 'D'}
                </div>
              )}
              <div className="hidden md:block">
                <h1 
                  className="text-xl font-sans font-semibold px-3 py-1 rounded-xl transition-all duration-300"
                  style={{ 
                    color: isDarkTheme ? '#ffffff' : '#111827' 
                  }}
                >
                  {doctor.nombre_completo}
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5 ml-3">
                  {doctor.especialidad || 'Ginecología y Obstetricia'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer mr-2 flex items-center" onClick={() => navigate('/dashboard/appointments')}>
              <MdNotifications 
                className="text-gray-600 dark:text-gray-300 text-base transition-colors" 
                style={{ color: notificationCount > 0 ? primaryColor : undefined }}
                onMouseEnter={(e) => e.target.style.color = primaryColor}
                onMouseLeave={(e) => e.target.style.color = notificationCount > 0 ? primaryColor : ''}
              />
              {notificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center animate-pulse">
                  {notificationCount}
                </span>
              )}
            </div>


            <button
              onClick={() => navigate(doctor?.slug_url ? `/${doctor.slug_url}` : '/')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <MdHome className="text-lg" />
              <span className="hidden md:inline">Inicio</span>
            </button>
            {showDashboardButton && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium flex items-center gap-2 transition-colors"
                title="Panel Principal"
              >
                <MdDashboard className="text-lg" />
                <span className="hidden md:inline">Panel Principal</span>
              </button>
            )}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <button
              onClick={handleLogout}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium flex items-center gap-2 transition-colors"
              title="Cerrar Sesión"
            >
              <MdLogout className="text-lg" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
