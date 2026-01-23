import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import { Sidebar } from './Sidebar';
import { appointmentService } from '../../services/appointmentService';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
// We won't strictly use PROFILE_THEMES constants for layout classes yet, but we will use the ID
// import { PROFILE_THEMES } from '../../lib/profileThemes'; 

export const DashboardLayout = () => {
  const { user: authUser } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState(0);
  // Use authUser as the primary source for doctor/user data
  const doctor = authUser;
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Only fetch appointments, user is already in store or handled by auth guard
        const appointments = await appointmentService.getAppointments();

        // Count 'scheduled' as pending/new appointments
        const pending = appointments.filter(a => a.status === 'scheduled').length;
        setPendingAppointmentsCount(pending);
      } catch (error) {
        console.error("Error initializing dashboard", error);
      }
    };
    initDashboard();
  }, [location.pathname, authUser]); // Re-run if user updates (e.g. theme change)

  // Determine theme: Priority: Doctor Config > Local Storage > Default
  const storedTheme = localStorage.getItem('theme_preference');
  const theme = doctor?.design_template || storedTheme || 'glass';
  const isDarkTheme = theme === 'dark';

  // Sync theme to localStorage and HTML class when doctor data loads or changes
  useEffect(() => {
    if (doctor?.design_template) {
      localStorage.setItem('theme_preference', doctor.design_template);
      if (doctor.design_template === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (isDarkTheme) {
      // If no doctor data yet but we determined dark from storage
      document.documentElement.classList.add('dark');
    }
  }, [doctor, isDarkTheme]);

  return (
    // 'dark' class is already handled on <html> by App.jsx, but we keep it here for local scoping if needed.
    // However, bg-gray-900 should be applied to the main wrapper too to be safe.
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-200 ${isDarkTheme ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <AdminHeader
        doctor={doctor}
        onMenuClick={toggleSidebar}
        notificationCount={pendingAppointmentsCount}
        isDarkTheme={isDarkTheme}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          counts={{ appointments: pendingAppointmentsCount }}
          isDarkTheme={isDarkTheme}
          primaryColor={doctor?.theme_primary_color}
        />

        <main className="flex-1 overflow-y-auto p-4 transition-all duration-500 ease-in-out dark:text-gray-200">
          <Outlet context={{ isSidebarOpen, setIsSidebarOpen, doctor, isDarkTheme }} />
        </main>
      </div>
    </div>
  );
};
