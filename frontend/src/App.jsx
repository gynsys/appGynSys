import { useEffect } from 'react'
import GynSysLoader from './components/common/GynSysLoader'
import { Toaster } from 'sonner'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ActivateAccountPage from './pages/ActivateAccountPage'
import DoctorProfilePage from './pages/DoctorProfilePage'
import DashboardOverviewPage from './pages/DashboardOverviewPage'
import ProfileEditorPage from './pages/ProfileEditorPage'
import TestimonialManager from './pages/dashboard/TestimonialManager'
import GalleryManager from './pages/dashboard/GalleryManager'
import AppointmentManager from './pages/dashboard/AppointmentManager'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import AdminRoute from './components/AdminRoute'
import ModuleProtectedRoute from './components/ModuleProtectedRoute'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminTenantsPage from './pages/admin/AdminTenantsPage'
import AdminPlansPage from './pages/admin/AdminPlansPage'
import AdminModulesPage from './pages/admin/AdminModulesPage'
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage'
import AdminLLMProvidersPage from './pages/admin/AdminLLMProvidersPage'
import BlogAdminPage from './modules/blog/pages/BlogAdminPage'
import SocialGeneratorPage from './modules/blog/pages/SocialGeneratorPage'
import BlogPublicPage from './modules/blog/pages/BlogPublicPage'
import BlogPostPage from './modules/blog/pages/BlogPostPage'
import ToastContainer from './components/common/Toast'
import { PreconsultaPage } from './features/preconsulta/pages/PreconsultaPage'
import { DoctorConsultationPage } from './features/doctor_consultation/pages/DoctorConsultationPage'


import CycleReportPage from './pages/CycleReportPage'
import CycleLayout from './layouts/CycleLayout'
import CycleDashboard from './pages/cycle-predictor/CycleDashboard'
import CycleLogsPage from './pages/cycle-predictor/CycleLogsPage'
import NotificationsPage from './pages/cycle-predictor/NotificationsPage'
import ProfilePage from './pages/cycle-predictor/ProfilePage'
import VerifyEmailPage from './pages/cycle-predictor/VerifyEmailPage'
import PublicCTAWrapper from './components/PublicCTAWrapper'

import DirectoryManager from './pages/dashboard/DirectoryManager'

import LocationsManager from './pages/dashboard/LocationsManager'
import ServicesManager from './pages/dashboard/ServicesManager'
import RecommendationsManager from './pages/dashboard/RecommendationsManager'
import PdfConfigurationPage from './pages/dashboard/PdfConfigurationPage'
import PreconsultationConfigPage from './pages/dashboard/PreconsultationConfigPage'
import PatientsManager from './pages/dashboard/PatientsManager'
import AppointmentRequestList from './pages/dashboard/AppointmentRequestList'
import QuickSetupPage from './pages/dashboard/QuickSetupPage'
// Removed OnboardingPage import

import OnlineConsultationSettings from './pages/dashboard/OnlineConsultationSettings'
import AdminNotificationManagerPage from './pages/admin/AdminNotificationManagerPage'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { WizardLayout } from './components/layout/WizardLayout'
import { useState } from 'react'
import { CapacitorPushListener } from './components/notifications/CapacitorPushListener'
import CampaignsPage from './features/campaigns/CampaignsPage'

import { isCapacitor } from './utils/platform'
import { applyDynamicTheme } from './utils/themeUtils'
const RootRedirector = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isNative = isCapacitor();
  const lastSlug = localStorage.getItem('last_doctor_slug');
  const cycleToken = localStorage.getItem('cycle_access_token');

  // Intelligent Redirect for APK OR PWA standalone mode
  if (isNative || isStandalone) {
    if (cycleToken) return <Navigate to="/cycle/dashboard" replace />;
    
    // Priority: Last visited slug > Default Slug for this personalized APK
    const targetSlug = lastSlug || 'mariel-herrera';
    return <Navigate to={`/${targetSlug}`} replace />;
  }

  // Regular browser users always see the Landing Page (avoids loop)
  // We use key=slug to force remounting when slug changes if needed, but here it's simple
  return <LandingPage />;
};

const OnboardingRedirect = () => {
    const { slug } = useParams();
    return <Navigate to={`/${slug}?onboarding=true`} replace />;
};

const LegacyDoctorRedirect = () => {
  const { slug, '*': rest } = useParams();
  return <Navigate to={`/${slug}${rest ? `/${rest}` : ''}`} replace />;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true)

  // Global theme effect & Auth Init
  useEffect(() => {
    // IMMEDIATE platform detection for zero-jump positioning
    const isMobile = window.innerWidth < 768;
    const isCap = isCapacitor();
    if (isMobile || isCap) {
      document.documentElement.classList.add('is-mobile-device');
    }
    if (isCap) {
      document.documentElement.classList.add('is-capacitor');
    }

    const initApp = async () => {
      // Try to load user if token exists (restore session)
      const token = localStorage.getItem('access_token');
      const cycleToken = localStorage.getItem('cycle_access_token');

      if ((token || cycleToken) && !useAuthStore.getState().user) {
        await useAuthStore.getState().loadUser();
      }

      // Preload appointments if user is authenticated (after loadUser)
      if (useAuthStore.getState().user && !useAuthStore.getState().user.is_cycle_user) {
        import('./store/appointmentStore').then(({ useAppointmentStore }) => {
          useAppointmentStore.getState().fetchAppointments()
        })

        // Preload notification rules (Admin only)
        if (useAuthStore.getState().user?.role === 'admin') {
          import('./stores/notificationStore').then(({ default: useNotificationStore }) => {
            useNotificationStore.getState().fetchRules()
          })
        }
      }

      const applyTheme = () => {
        const theme = localStorage.getItem('theme_preference');
        // Solo aplicar dark si el inquilino lo tiene configurado explícitamente.
        // NO usar prefers-color-scheme del sistema: el tema del doctor manda.
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Aplica el color primario dinámico del inquilino (White-Label)
        const primaryColor = localStorage.getItem('tenant_theme_primary');
        if (primaryColor) {
          applyDynamicTheme(primaryColor);
        } else {
          // Color por defecto si no hay inquilino configurado (Indigo 600)
          applyDynamicTheme('#4f46e5');
        }
      };

      // Apply immediately
      applyTheme();

      // Listen for storage changes (cross-tab)
      window.addEventListener('storage', applyTheme);

      // Listen for auth logout events from axios interceptor
      const handleDoctorLogout = () => {
        useAuthStore.getState().logoutDoctor();
      };
      const handlePatientLogout = () => {
        useAuthStore.getState().logoutPatient();
      };

      window.addEventListener('auth:logout:doctor', handleDoctorLogout);
      window.addEventListener('auth:logout:patient', handlePatientLogout);

      return () => {
        window.removeEventListener('storage', applyTheme);
        window.removeEventListener('auth:logout:doctor', handleDoctorLogout);
        window.removeEventListener('auth:logout:patient', handlePatientLogout);
      };
    };

    initApp().then(() => setIsInitializing(false));
  }, []);

  // --- Google OAuth Redirect Handler (Root Level) ---
  // When Google redirects to https://gynsys.net#access_token=...,
  // LoginForm is not mounted. We capture the token here and redirect
  // back to the tenant's profile page.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return;

    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    if (!accessToken) return;

    // Clean URL immediately to prevent re-processing on refresh
    window.history.replaceState({}, document.title, window.location.pathname);

    const processGoogleToken = async () => {
      try {
        const { authService } = await import('./services/authService');
        const response = await authService.loginGoogle(accessToken, false);

        if (response?.access_token) {
          localStorage.setItem('access_token', response.access_token);
          await useAuthStore.getState().loadUser();
        }

        // Redirect back to the tenant's page
        const returnPath = localStorage.getItem('google_oauth_return_path');
        localStorage.removeItem('google_oauth_return_path');

        if (returnPath && returnPath !== '/') {
          window.location.href = returnPath;
        } else {
          // Fallback: use last known slug or dashboard
          const lastSlug = localStorage.getItem('last_doctor_slug');
          window.location.href = lastSlug ? `/${lastSlug}` : '/dashboard';
        }
      } catch (err) {
        console.error('[GynSys] Google OAuth redirect login failed:', err);
        const returnPath = localStorage.getItem('google_oauth_return_path');
        localStorage.removeItem('google_oauth_return_path');
        // Even on error, redirect back so user sees something useful
        if (returnPath) window.location.href = returnPath;
      }
    };

    processGoogleToken();
  }, []);

  // Show loading screen during initialization
  if (isInitializing) {
    return <GynSysLoader />
  }

  return (
    <>
      <CapacitorPushListener />
      <Toaster position="top-center" richColors />
      <ToastContainer />
      <Routes>
        {/* Legacy Redirection - MOVE TO TOP for priority */}
        <Route path="/dr/:slug/*" element={<LegacyDoctorRedirect />} />

        <Route path="/preconsulta" element={<PreconsultaPage />} />
        <Route path="/:slug/preconsulta" element={<DoctorProfilePage />} />
        <Route path="/:slug/onboarding" element={<OnboardingRedirect />} />
        <Route path="/cycle-report" element={<CycleReportPage />} />

        {/* Cycle Predictor Routes */}
        <Route path="/cycle" element={<CycleLayout />}>
          <Route index element={<Navigate to="/cycle/dashboard" replace />} />
          <Route path="dashboard" element={<CycleDashboard />} />
          <Route path="logs" element={<CycleLogsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<RootRedirector />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/activar-cuenta" element={<ActivateAccountPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />



        {/* Public Doctor Routes */}
        <Route path="/:slug" element={<PublicCTAWrapper><DoctorProfilePage /></PublicCTAWrapper>} />
        <Route path="/:slug/blog" element={<PublicCTAWrapper><BlogPublicPage /></PublicCTAWrapper>} />
        <Route path="/:slug/blog/:postSlug" element={<PublicCTAWrapper><BlogPostPage /></PublicCTAWrapper>} />

        {/* Wizard Setup Route (Sidebar-free) */}
        <Route path="/dashboard/setup" element={
          <ProtectedRoute>
            <WizardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<QuickSetupPage />} />
        </Route>

        {/* Dashboard Routes (SPA Layout) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="consultation" element={<DoctorConsultationPage />} />
          <Route path="preconsulta-config" element={<PreconsultationConfigPage />} />
          <Route path="pdf-config" element={<PdfConfigurationPage />} />
          <Route path="blog" element={<BlogAdminPage />} />
          <Route path="social-generator" element={<SocialGeneratorPage />} />
          <Route path="profile" element={<ProfileEditorPage />} />
          <Route path="profile/testimonials" element={<TestimonialManager />} />
          <Route path="profile/gallery" element={<GalleryManager />} />
          <Route path="locations" element={<LocationsManager />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="recommendations" element={<RecommendationsManager />} />
          <Route path="appointments" element={<AppointmentManager />} />
          <Route path="requests" element={<AppointmentRequestList />} />
          <Route path="patients" element={<PatientsManager />} />
          <Route path="directory" element={<DirectoryManager />} />
          <Route path="online-consultations" element={<OnlineConsultationSettings />} />
          <Route path="campaigns" element={<CampaignsPage />} />
        </Route>



        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="tenants" element={<AdminTenantsPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="modules" element={<AdminModulesPage />} />
          <Route path="templates" element={<AdminTemplatesPage />} />
          <Route path="notifications" element={<AdminNotificationManagerPage />} />
          <Route path="llm-providers" element={<AdminLLMProvidersPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
