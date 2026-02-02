import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DoctorProfilePage from './pages/DoctorProfilePage'
import DashboardOverviewPage from './pages/DashboardOverviewPage'
import ProfileEditorPage from './pages/ProfileEditorPage'
import TestimonialManager from './pages/dashboard/TestimonialManager'
import GalleryManager from './pages/dashboard/GalleryManager'
import AppointmentManager from './pages/dashboard/AppointmentManager'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ModuleProtectedRoute from './components/ModuleProtectedRoute'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminTenantsPage from './pages/admin/AdminTenantsPage'
import AdminPlansPage from './pages/admin/AdminPlansPage'
import AdminModulesPage from './pages/admin/AdminModulesPage'
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage'
import BlogAdminPage from './modules/blog/pages/BlogAdminPage'
import BlogPublicPage from './modules/blog/pages/BlogPublicPage'
import BlogPostPage from './modules/blog/pages/BlogPostPage'
import ToastContainer from './components/common/Toast'
import { PreconsultaPage } from './features/preconsulta/pages/PreconsultaPage'
import { DoctorConsultationPage } from './features/doctor_consultation/pages/DoctorConsultationPage'


import CycleReportPage from './pages/CycleReportPage'

import LocationsManager from './pages/dashboard/LocationsManager'
import ServicesManager from './pages/dashboard/ServicesManager'
import RecommendationsManager from './pages/dashboard/RecommendationsManager'
import PdfConfigurationPage from './pages/dashboard/PdfConfigurationPage'
import PreconsultationConfigPage from './pages/dashboard/PreconsultationConfigPage'
import PatientsManager from './pages/dashboard/PatientsManager'
import ChatPage from './pages/dashboard/ChatPage'
import OnlineConsultationSettings from './pages/dashboard/OnlineConsultationSettings'
import NotificationManagerPage from './pages/dashboard/NotificationManagerPage'
import { DashboardLayout } from './components/layout/DashboardLayout'

function App() {
  // Global theme effect & Auth Init
  useEffect(() => {
    const initApp = async () => {
      // Try to load user if token exists (restore session)
      const token = localStorage.getItem('access_token');
      if (token && !useAuthStore.getState().user) {
        await useAuthStore.getState().loadUser();
      }

      // Preload appointments if user is authenticated (after loadUser)
      if (useAuthStore.getState().user) {
        import('./store/appointmentStore').then(({ useAppointmentStore }) => {
          useAppointmentStore.getState().fetchAppointments()
        })

        // Preload notification rules
        import('./stores/notificationStore').then(({ default: useNotificationStore }) => {
          useNotificationStore.getState().fetchRules()
        })
      }

      const applyTheme = () => {
        const theme = localStorage.getItem('theme_preference');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };

      // Apply immediately
      applyTheme();

      // Listen for storage changes (cross-tab)
      window.addEventListener('storage', applyTheme);

      // Listen for auth logout events from axios interceptor
      const handleAuthLogout = () => {
        useAuthStore.getState().logout();
      };
      window.addEventListener('auth:logout', handleAuthLogout);

      return () => {
        window.removeEventListener('storage', applyTheme);
        window.removeEventListener('auth:logout', handleAuthLogout);
      };
    };

    initApp();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <ToastContainer />
      <Routes>
        <Route path="/preconsulta" element={<PreconsultaPage />} />
        <Route path="/dr/:slug/preconsulta" element={<DoctorProfilePage />} />
        <Route path="/cycle-report" element={<CycleReportPage />} />

        <Route path="/" element={<Navigate to="/dr/mariel-herrera" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />



        {/* Public Doctor Routes */}
        <Route path="/dr/:slug" element={<DoctorProfilePage />} />
        <Route path="/dr/:slug/blog" element={<BlogPublicPage />} />
        <Route path="/dr/:slug/blog/:postSlug" element={<BlogPostPage />} />

        {/* Dashboard Routes (SPA Layout) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="consultation" element={<DoctorConsultationPage />} />
          <Route path="preconsulta-config" element={<PreconsultationConfigPage />} />
          <Route path="pdf-config" element={<PdfConfigurationPage />} />
          <Route path="blog" element={<BlogAdminPage />} />
          <Route path="profile" element={<ProfileEditorPage />} />
          <Route path="profile/testimonials" element={<TestimonialManager />} />
          <Route path="profile/gallery" element={<GalleryManager />} />
          <Route path="locations" element={<LocationsManager />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="recommendations" element={<RecommendationsManager />} />
          <Route path="appointments" element={<AppointmentManager />} />
          <Route path="patients" element={<PatientsManager />} />
          <Route path="online-consultations" element={<OnlineConsultationSettings />} />
          <Route path="notifications" element={<NotificationManagerPage />} />
        </Route>



        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tenants"
          element={
            <AdminRoute>
              <AdminTenantsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <AdminRoute>
              <AdminPlansPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/modules"
          element={
            <AdminRoute>
              <AdminModulesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <AdminRoute>
              <AdminTemplatesPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
