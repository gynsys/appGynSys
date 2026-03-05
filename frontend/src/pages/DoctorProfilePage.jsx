import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { FiClipboard, FiCalendar, FiActivity, FiArrowUp } from 'react-icons/fi'
import { Phone, Mail, MapPin, Calendar, Award, Building2, Clock, ExternalLink, Star, MessageCircle, Heart, Share2, ChevronDown, Loader2 } from 'lucide-react'
import ScrollReveal from '../components/common/ScrollReveal'
import { doctorService } from '../services/doctorService'
import { blogService } from '../modules/blog/services/blogService'
import { onlineConsultationService } from '../services/onlineConsultationService'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { useAuth } from '../features/auth/useAuth'
import Navbar from '../components/layout/Navbar'
import AppointmentModal from '../components/features/AppointmentModal'
import RecommendationsCarousel from '../components/features/RecommendationsCarousel'
import PreconsultaWidget from '../features/preconsulta/components/PreconsultaWidget'
import EndometriosisTestModal from '../components/features/EndometriosisTestModal'
import CyclePredictorModal from '../components/cycle-predictor/CyclePredictorModal'
import ServicesSection from '../components/features/ServicesSection'
import BlogSection from '../components/features/BlogSection'
import TestimonialsSection from '../components/features/TestimonialsSection'
import GallerySection from '../components/features/GallerySection'
import LocationsSection from '../components/features/LocationsSection'
import FAQSection from '../components/features/FAQSection'
import CertificationsSection from '../components/features/CertificationsSection'
import SectionCard from '../components/common/SectionCard'
import SocialLinks from '../components/common/SocialLinks'
import { BottomNav, NavIcons } from '../components/common/BottomNav'

import { getImageUrl } from '../lib/imageUtils'

import LoginModal from '../components/features/LoginModal'
import Modal from '../components/common/Modal'
import OnlineChatBooking from '../components/features/OnlineChatBooking'
import OnlineConsultationSection from '../components/features/OnlineConsultationSection'
import PWAInstallButton from '../components/common/PWAInstallButton'
import CycleMarketingSection from '../components/features/CycleMarketingSection'
import CycleAuthDialog from '../components/cycle-predictor/CycleAuthDialog'


import whatsappLogo from '../assets/whatsapp-logo.png'

export default function DoctorProfilePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const { logout } = useAuth()
  const toast = useToastStore()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [historyPdfUrl, setHistoryPdfUrl] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

  const handleMedicalHistoryClick = async () => {
    if (!user?.email) return
    try {
      const token = localStorage.getItem('cycle_access_token') || localStorage.getItem('access_token')
      const res = await fetch(`${API_BASE}/consultations/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const all = await res.json()
        // Find the consultation matching this user's email
        const match = all.find(c =>
          c.patient_email?.toLowerCase() === user.email?.toLowerCase()
        )
        if (match) {
          setHistoryPdfUrl(`${API_BASE}/consultations/${match.id}/history_pdf`)
          setShowHistoryModal(true)
        } else {
          // No consultation found — navigate to cycle dashboard as fallback
          window.location.href = '/cycle/dashboard'
        }
      }
    } catch (e) {
      window.location.href = '/cycle/dashboard'
    }
  }

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [isOnlineConsultationModalOpen, setIsOnlineConsultationModalOpen] = useState(false)
  const [onlineSettings, setOnlineSettings] = useState(null)
  const [latestBlogPost, setLatestBlogPost] = useState(null)

  // Preconsulta Logic
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment_id')
  const [isPreconsultaOpen, setIsPreconsultaOpen] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  // Modal Handlers
  const handleOpenTest = () => setIsTestModalOpen(true)
  const handleOpenAppointment = () => setIsAppointmentModalOpen(true)
  const handleOpenCycle = () => navigate('/cycle/dashboard')

  // Manejar visibilidad del botón "Ir arriba" basado en scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 1100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (location.pathname.includes('/preconsulta') && appointmentId) {
      setIsPreconsultaOpen(true)
    }
  }, [location.pathname, appointmentId])

  const handleLogout = () => {
    // Show success message first
    toast.success('Sesión cerrada exitosamente')
    // Then logout without redirecting - explicitly pass false
    logout(false)
    // Clear any redirect targets
    localStorage.removeItem('redirect_after_login')
  }

  const handleProtectedAction = (targetPath) => {
    // Calculate isOwner here
    const isOwner = user && doctor && (user.slug_url === doctor.slug_url || user.id === doctor.id)

    if (isAuthenticated && isOwner) {
      navigate(targetPath)
    } else {
      // Save the target path for redirection after login
      localStorage.setItem('redirect_after_login', targetPath)
      // Show alert
      toast.warning('Debes iniciar sesión para acceder a esta sección')
      // After alert, open login modal
      setTimeout(() => {
        setIsLoginModalOpen(true)
      }, 2000) // Wait 2 seconds for the user to see the alert
    }
  }

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        // Optimistic UI: If we are logged in and looking at our own profile, load immediately
        const isSelfProfile = isAuthenticated && user && (user.slug_url === slug || user.id === slug)

        if (isSelfProfile) {
          setDoctor(user)
          setLoading(false)
        } else {
          setLoading(true)
        }

        const data = await doctorService.getDoctorProfileBySlug(slug)

        // Security check: Admins do not have public profiles
        // if (data.role === 'admin') {
        //   throw { response: { data: { detail: 'Perfil no encontrado' } } }
        // }

        setDoctor(data)

        // Check if blog module is enabled and fetch latest post
        const hasBlog = data.enabled_modules?.includes('blog') ||
          data.enabled_modules?.some(m => m.code === 'blog')

        if (hasBlog) {
          try {
            const posts = await blogService.getPublicPosts(slug)
            if (posts && posts.length > 0) {
              // Sort by date descending just in case, though backend usually handles this
              const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              setLatestBlogPost(sortedPosts[0])
            }
          } catch (err) {
          }
        }

        // Load online consultation settings (Always enabled as core feature)
        try {
          const settings = await onlineConsultationService.getPublicSettings(slug)
          setOnlineSettings(settings)
        } catch (onlineError) {
          console.error('Error fetching online consultation settings:', onlineError)
        }

      } catch (err) {
        // Only set error if we don't have a doctor displayed (failed optimistic load)
        if (!doctor) {
          setError(err.response?.data?.detail || 'Perfil no encontrado')
        }
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchDoctor()
    }
  }, [slug])

  useEffect(() => {
    if (doctor?.theme_primary_color) {
      document.documentElement.style.setProperty(
        '--primary-color',
        doctor.theme_primary_color
      )
      // Persist for Cycle App (Guest Mode)
      localStorage.setItem('tenant_theme_primary', doctor.theme_primary_color)

      // Persist for Smart Redirect (SaaS Flow)
      if (doctor.slug_url) {
        localStorage.setItem('last_doctor_slug', doctor.slug_url)
      }
    }
    // document.title removed as per user request to avoid PWA title issues

    // Sync theme-color meta tag and html class with doctor's theme
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (doctor?.design_template === 'dark') {
      document.documentElement.classList.add('dark')
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#111827') // gray-950
    } else {
      document.documentElement.classList.remove('dark')
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff')
    }
  }, [doctor])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <style>
          {`
            @keyframes heartbeat {
              0% { transform: scale(1); }
              14% { transform: scale(1.15); }
              28% { transform: scale(1); }
              42% { transform: scale(1.15); }
              70% { transform: scale(1); }
            }
            .animate-heartbeat {
              animation: heartbeat 1.5s infinite;
            }
          `}
        </style>
        <div className="text-center flex flex-col items-center">
          <img
            src="/GynSys.png"
            alt="Cargando perfil..."
            className="w-24 h-auto object-contain animate-heartbeat drop-shadow-md"
          />
        </div>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Perfil no encontrado</h1>
          <p className="text-gray-600">{error || 'El perfil que buscas no existe'}</p>
        </div>
      </div>
    )
  }

  // Check if current user owns this profile
  // user comes from useAuthStore hook at the top
  const isOwner = isAuthenticated && user && doctor && (user.slug_url === doctor.slug_url || user.id === doctor.id)

  // Helper to check if a module is enabled (handles strings and objects)
  const isModuleEnabled = (code) => {
    return doctor?.enabled_modules?.some(m =>
      typeof m === 'string'
        ? m === code
        : m.code === code
    )
  }

  const theme = doctor?.design_template || 'glass'
  const isDarkTheme = theme === 'dark'

  const primaryColor = doctor.theme_primary_color || '#4F46E5' // Default indigo

  // Disable explicit background colors in dark mode so classes take over
  // Also disable for 'minimal' theme to enforce pure white standard
  const bodyBgStyle = (doctor.theme_body_bg_color && !isDarkTheme && theme !== 'minimal') ? { background: doctor.theme_body_bg_color } : {}
  // Pass null for container color in dark mode so SectionCard uses its CSS classes
  const containerBgColor = isDarkTheme ? null : doctor.theme_container_bg_color

  // Determine global background class based on theme
  let globalBgClass = ''
  if (!bodyBgStyle.background) {
    if (isDarkTheme) {
      globalBgClass = 'bg-gray-950 text-white'
    } else if (theme === 'minimal') {
      // Minimal theme: Pure white background for cleaner look
      globalBgClass = 'bg-white text-gray-900 transition-colors duration-200'
    } else {
      globalBgClass = 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200'
    }
  }

  const isAnyModalOpen = isLoginModalOpen || isAppointmentModalOpen || isTestModalOpen || isCycleModalOpen || isOnlineConsultationModalOpen || isPreconsultaOpen

  // Bottom Navigation Handlers
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBlog = () => {
    const blogSection = document.getElementById('blog')
    if (blogSection) {
      blogSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const openWhatsApp = () => {
    if (doctor?.whatsapp_url) {
      window.open(doctor.whatsapp_url, '_blank', 'noopener,noreferrer')
    }
  }

  const navigateToBooking = () => {
    setIsAppointmentModalOpen(true)
  }

  // Bottom nav configuration
  const navItems = [
    {
      icon: <NavIcons.Home />,
      label: 'Inicio',
      action: scrollToTop,
      isActive: window.scrollY < 100
    },
    {
      icon: <NavIcons.WhatsApp />,
      label: 'WhatsApp',
      action: openWhatsApp,
      isActive: false
    },
    {
      icon: <NavIcons.Calendar />,
      label: 'Agendar',
      action: navigateToBooking,
      isActive: isAppointmentModalOpen
    },
    {
      icon: <NavIcons.Blog />,
      label: 'Blog',
      action: () => navigate(`/dr/${slug}/blog`),
      isActive: false
    }
  ]



  return (
    <div
      className={`min-h-screen pb-16 md:pb-0 ${globalBgClass} ${isDarkTheme ? 'dark' : ''}`}
      style={bodyBgStyle}
    >
      {/* Modern Navbar */}
      <Navbar
        doctor={doctor}
        primaryColor={primaryColor}
        onAppointmentClick={handleOpenAppointment}
        onTestClick={handleOpenTest}
        onCycleClick={handleOpenCycle}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onRegisterClick={() => setIsRegisterModalOpen(true)}
        onMedicalHistoryClick={handleMedicalHistoryClick}
        containerShadow={doctor.container_shadow}
        containerBgColor={containerBgColor}
      />

      {/* Admin Panel Button - Sticky Row */}

      {/* Floating Panel Admin button — only for authenticated doctor on their own page (desktop only) */}
      {isAuthenticated && (user?.slug_url === slug || user?.id === doctor?.id) && (
        <div className="hidden md:block fixed top-4 right-4 z-[60]">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-xl transition-all hover:opacity-90 hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Panel Admin
          </a>
        </div>
      )}



      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Section - Right after navbar */}
        <ScrollReveal variant="fade-up" className="w-full">
          <SectionCard
            id="sobre-mi"
            theme={theme}
            containerBgColor={containerBgColor}
            className="flex items-center justify-center min-h-[500px]"
            title=""
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                {/* Doctor Photo with Animation */}
                <ScrollReveal variant="zoom-in" delay={0.2} className="flex flex-col items-center justify-center relative">
                  <div className="relative group perspective-1000">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 scale-110" />
                    {doctor.photo_url ? (
                      <img
                        src={getImageUrl(doctor.photo_url)}
                        alt={doctor.nombre_completo}
                        className={`relative w-96 h-96 md:w-[30rem] md:h-[30rem] object-cover rounded-full shadow-2xl ${doctor.profile_image_border !== false ? 'border-4 border-white/50' : ''} transition-transform duration-500 hover:scale-105 hover:rotate-1`}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextElementSibling.style.display = 'flex'
                        }}
                      />
                    ) : (
                      <div
                        className={`w-96 h-96 md:w-[30rem] md:h-[30rem] flex items-center justify-center text-8xl font-bold text-white shadow-2xl rounded-full ${doctor.profile_image_border !== false ? 'border-4 border-white/50' : ''}`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {doctor.nombre_completo.charAt(0)}
                      </div>
                    )}
                  </div>
                </ScrollReveal>

                {/* About Content */}
                <ScrollReveal variant="slide-left" delay={0.4} className="md:pl-8">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-8 leading-tight">
                    Hola, soy <br />
                    <span
                      className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${primaryColor}, #9333ea, ${primaryColor})`
                      }}
                    >
                      {doctor.nombre_completo}
                    </span>
                  </h2>

                  {doctor.biografia ? (
                    <div className="prose prose-lg dark:prose-invert text-gray-600/90 leading-relaxed text-justify font-medium mb-8"
                      dangerouslySetInnerHTML={{ __html: doctor.biografia }}
                    />
                  ) : (
                    <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-justify font-medium relative z-10 mb-8">
                      <p>
                        Soy <span className="text-gray-900 font-bold">{doctor.especialidad || 'Ginecólogo - Obstetra'}</span> graduada de la
                        <strong> {doctor.universidad || 'Universidad Central de Venezuela (UCV)'}</strong>, una de las instituciones más prestigiosas.
                      </p>
                      <p>
                        Mi pasión es brindar un cuidado integral en el diagnóstico y tratamiento de <strong>Endometriosis</strong>,
                        uniendo la última tecnología con una calidad humana inquebrantable.
                      </p>
                      <p>
                        Mi compromiso es escucharte y acompañarte, para que juntas construyamos el camino hacia tu bienestar pleno.
                      </p>
                    </div>
                  )}

                  {/* Endometriosis Test CTA - Tactical Placement (PC ONLY) */}
                  {isModuleEnabled('endometriosis_test') && (
                    <div className="hidden md:flex justify-end mt-8">
                      <button
                        onClick={handleOpenTest}
                        className="px-8 py-3 rounded-xl font-bold text-sm shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center bg-pink-500 text-white hover:bg-pink-600 group"
                      >
                        <Heart className="mr-2 w-5 h-5 group-hover:animate-pulse" />
                        Realizar Test Endometriosis
                      </button>
                    </div>
                  )}
                </ScrollReveal>
              </div>
            </div>
          </SectionCard>
        </ScrollReveal>


        {/* Certifications Authority Bar */}
        {isModuleEnabled('certifications') && (
          <ScrollReveal variant="fade-in" delay={0.1}>
            <CertificationsSection
              primaryColor={primaryColor}
              certifications={doctor.certifications}
              show_carousel={doctor.show_certifications_carousel}
              containerBgColor={containerBgColor}
              theme={theme}
            />
          </ScrollReveal>
        )}

        {/* Services Section */}
        {isModuleEnabled('services') && (
          <ScrollReveal variant="fade-up">
            <ServicesSection
              doctorSlug={slug}
              primaryColor={primaryColor}
              cardShadow={doctor.card_shadow}
              containerShadow={doctor.container_shadow}
              containerBgColor={containerBgColor}
              sectionTitle={doctor.services_section_title || 'Nuestros Servicios'}
              theme={theme}
              onAppointmentClick={() => setIsAppointmentModalOpen(true)}
            />
          </ScrollReveal>
        )}

        {/* Online Consultation Section - Marketing */}
        {onlineSettings?.is_active && isModuleEnabled('online_consultation') && (
          <ScrollReveal variant="fade-up" delay={0.1}>
            <OnlineConsultationSection
              doctor={doctor}
              settings={onlineSettings}
              onOpenChat={() => setIsOnlineConsultationModalOpen(true)}
              primaryColor={primaryColor}
              containerBgColor={containerBgColor}
              theme={theme}
            />
          </ScrollReveal>
        )}

        {/* Cycle Marketing Section - SEO & Conversion */}
        {isModuleEnabled('cycle_predictor') && (
          <CycleMarketingSection
            primaryColor={primaryColor}
            containerBgColor={containerBgColor}
            theme={theme}
            doctorSlug={slug}
          />
        )}

        {/* Recommendations Section */}
        {isModuleEnabled('recommendations') && (
          <ScrollReveal variant="fade-up" delay={0.2}>
            <RecommendationsCarousel doctorSlug={slug} primaryColor={primaryColor} isDarkMode={isDarkTheme} />
          </ScrollReveal>
        )}

        {/* Blog Section */}
        {isModuleEnabled('blog') && (
          <ScrollReveal variant="fade-up" delay={0.2}>
            <BlogSection doctor={doctor} primaryColor={primaryColor} cardShadow={doctor.card_shadow} containerShadow={doctor.container_shadow} containerBgColor={containerBgColor} theme={theme} />
          </ScrollReveal>
        )}

        {/* Testimonials Section */}
        {isModuleEnabled('testimonials') && (
          <ScrollReveal variant="fade-up" delay={0.1}>
            <TestimonialsSection doctorSlug={slug} doctorId={doctor.id} primaryColor={primaryColor} cardShadow={doctor.card_shadow} containerShadow={doctor.container_shadow} containerBgColor={containerBgColor} theme={theme} />
          </ScrollReveal>
        )}

        {/* Gallery Section (fixed width 60%) */}
        {isModuleEnabled('gallery') && (
          <ScrollReveal variant="zoom-in">
            <GallerySection doctorSlug={slug} primaryColor={primaryColor} cardShadow={doctor.card_shadow} containerShadow={doctor.container_shadow} containerBgColor={containerBgColor} galleryWidth={'60%'} theme={theme} />
          </ScrollReveal>
        )}

        {/* Locations Section */}
        {isModuleEnabled('locations') && (
          <ScrollReveal variant="fade-up">
            <LocationsSection doctor={doctor} primaryColor={primaryColor} cardShadow={doctor.card_shadow} containerShadow={doctor.container_shadow} containerBgColor={containerBgColor} theme={theme} />
          </ScrollReveal>
        )}

        {/* FAQ Section */}
        {isModuleEnabled('faqs') && (
          <ScrollReveal variant="fade-up">
            <FAQSection doctorSlug={slug} primaryColor={primaryColor} cardShadow={doctor.card_shadow} containerShadow={doctor.container_shadow} containerBgColor={containerBgColor} theme={theme} />
          </ScrollReveal>
        )}
      </main>

      {/* Floating Action Buttons - Hidden on Mobile (using Bottom Nav instead) */}
      <div className="hidden md:flex fixed bottom-6 right-6 flex-col space-y-3 z-40 items-center">
        {/* Back to Top Button - Smooth fade transition and minimalist design */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`w-10 h-10 rounded-full transform hover:scale-110 active:scale-95 transition-all duration-700 flex items-center justify-center bg-transparent mb-2 border border-[#98A2A644] hover:border-[#98A2A688] ${showScrollToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          style={{ color: '#98A2A6' }}
          aria-label="Volver arriba"
        >
          <FiArrowUp className="w-5 h-5 opacity-70" />
        </button>


        {/* WhatsApp Button - Desktop */}
        {doctor.whatsapp_url && (
          <a
            href={doctor.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex transition-transform transform hover:scale-110 active:scale-95 items-center justify-center bg-transparent p-0 z-50"
            title="Chatear por WhatsApp"
          >
            <img
              src={whatsappLogo}
              alt="WhatsApp"
              className="w-[45px] h-[45px] drop-shadow-xl"
            />
          </a>
        )}

      </div>

      {/* Shared Modals */}
      <EndometriosisTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        primaryColor={primaryColor}
        doctorName={doctor?.nombre_completo}
        doctorId={doctor?.id}
        doctorPhoto={doctor?.photo_url}
        isDarkMode={isDarkTheme}
        onSchedule={handleOpenAppointment}
        onCycle={handleOpenCycle}
      />
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        doctorId={doctor?.id}
        doctor={doctor}
        primaryColor={primaryColor}
      />

      <PreconsultaWidget
        isOpen={isPreconsultaOpen}
        onClose={() => setIsPreconsultaOpen(false)}
        appointmentId={appointmentId}
        primaryColor={primaryColor}
        doctorName={doctor?.nombre_completo}
      />

      {/* Social Links */}
      <div className="flex justify-center mt-20 mb-8">
        <SocialLinks doctor={doctor} iconClassName="w-6 h-6" />
      </div>

      {/* Footer */}
      <footer
        className={`${doctor.container_shadow ? 'shadow-inner' : 'border-t'} transition-colors duration-200 ${!containerBgColor ? 'bg-white dark:bg-gray-800 dark:border-gray-700' : ''}`}
        style={containerBgColor ? { backgroundColor: containerBgColor } : {}}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} {doctor.nombre_completo}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Cycle Predictor Modal */}
      <CyclePredictorModal open={isCycleModalOpen} onOpenChange={setIsCycleModalOpen} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} primaryColor={primaryColor} darkMode={isDarkTheme} onRegisterClick={() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true) }} />
      <CycleAuthDialog
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        initialView="register"
        slug={slug}
      />

      {/* Historia Médica PDF Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => { setShowHistoryModal(false); setHistoryPdfUrl(null) }}
        title="Vista Previa — Historia Médica"
        size="4xl"
      >
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden" style={{ height: '80vh' }}>
          {historyPdfUrl && (
            <iframe
              src={historyPdfUrl}
              className="w-full h-full border-0"
              title="Historia Médica PDF"
            />
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => { setShowHistoryModal(false); setHistoryPdfUrl(null) }}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* Online Consultation Modal (triggered from hero section) */}
      <OnlineChatBooking
        doctorId={doctor.id}
        doctor={doctor}
        isOpen={isOnlineConsultationModalOpen}
        onClose={() => setIsOnlineConsultationModalOpen(false)}
        settings={onlineSettings}
      />



      {/* Bottom Navigation - Mobile Only */}
      <BottomNav items={navItems} theme={primaryColor} className="md:hidden" />

    </div >
  )
}

