import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDashboard, MdLogout, MdHome, MdMenu, MdNotifications } from 'react-icons/md';
import { authService } from '../../services/authService';
import { getImageUrl } from '../../lib/imageUtils';

export const AdminHeader = ({ showDashboardButton = true, onMenuClick, notificationCount = 0, doctor }) => {
  const navigate = useNavigate();

  // Doctor is now passed from parent DashboardLayout

  const handleLogout = () => {
    authService.logout();
    navigate('/');
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
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {doctor.nombre_completo?.charAt(0) || 'D'}
                </div>
              )}
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {doctor.nombre_completo}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {doctor.especialidad || 'Ginecología y Obstetricia'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer mr-2" onClick={() => navigate('/dashboard/appointments')}>
              <MdNotifications className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-2xl transition-colors" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {notificationCount}
                </span>
              )}
            </div>

            <button
              onClick={() => navigate(doctor?.slug_url ? `/dr/${doctor.slug_url}` : '/')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium hidden md:flex items-center gap-2"
            >
              <MdHome className="text-lg" />
              Inicio
            </button>
            {showDashboardButton && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium hidden md:flex items-center gap-2"
              >
                <MdDashboard className="text-lg" />
                Panel Principal
              </button>
            )}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <button
              onClick={handleLogout}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <MdLogout className="text-lg" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
