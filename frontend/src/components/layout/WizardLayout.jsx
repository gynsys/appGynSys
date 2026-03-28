import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import { useAuthStore } from '../../store/authStore';

/**
 * WizardLayout is a simplified layout for the SaaS Quick Setup (Wizard).
 * It removes the Sidebar and BottomNav to provide a clean, distraction-free environment.
 */
export const WizardLayout = () => {
  const { user: authUser } = useAuthStore();
  const doctor = authUser;

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
      document.documentElement.classList.add('dark');
    }
  }, [doctor, isDarkTheme]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkTheme ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <AdminHeader
        doctor={doctor}
        showDashboardButton={true} // Allow user to go back to dashboard if they want
        isDarkTheme={isDarkTheme}
        // No onMenuClick means no Sidebar Toggle button
      />

      <main className="flex-1 p-4 md:p-8 transition-all duration-500 ease-in-out dark:text-gray-200">
        <div className="max-w-7xl mx-auto">
          <Outlet context={{ doctor, isDarkTheme }} />
        </div>
      </main>
    </div>
  );
};
