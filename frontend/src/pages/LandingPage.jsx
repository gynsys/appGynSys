import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoginModal from '../components/features/LoginModal'
import { Check, ArrowRight, Shield, Calendar, Clipboard, Activity, Globe, Users } from 'lucide-react'

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const features = [
    {
      icon: <Globe className="w-10 h-10 text-indigo-600" />,
      title: "Tu Propia Web Profesional",
      description: "Crea tu sitio médico personalizado con tu slug único en minutos. Sin complicaciones técnicas."
    },
    {
      icon: <Calendar className="w-10 h-10 text-indigo-600" />,
      title: "Agendamiento Inteligente",
      description: "Permite que tus pacientes reserven citas 24/7 con integración directa en tu calendario."
    },
    {
      icon: <Check className="w-10 h-10 text-indigo-600" />,
      title: "App GynSys (PWA)",
      description: "Instala tu consultorio directamente como una App en el móvil. Acceso rápido y notificaciones en tiempo real."
    },
    {
      icon: <Activity className="w-10 h-10 text-indigo-600" />,
      title: "Control Mi Ciclo",
      description: "Tus pacientes pueden gestionar su ciclo menstrual y control prenatal directamente desde tu plataforma."
    },
    {
      icon: <Clipboard className="w-10 h-10 text-indigo-600" />,
      title: "Pre-consultas Digitales",
      description: "Recibe información clínica vital antes de la consulta para optimizar tu tiempo y diagnóstico."
    },
    {
      icon: <Users className="w-10 h-10 text-indigo-600" />,
      title: "Gestión de Pacientes",
      description: "Centraliza la información de tus pacientes, historias clínicas y seguimientos en un solo lugar."
    }
  ]

  const promotionalPlan = {
    id: 1,
    name: "Plan Profesional Integral",
    price: "9.99",
    description: "Acceso total a todas las herramientas de GynSys por un costo mensual promocional.",
    features: [
      "Página Web con /dr/slug",
      "Socio Tecnológico: Mi Ciclo (App Pacientes)",
      "App Móvil PWA (Para el Doctor)",
      "Gestión de Citas y Pre-consultas",
      "Blog y Educación para Pacientes",
      "Control Prenatal y Menstrual",
      "Soporte Prioritario"
    ],
    cta: "Comenzar con Precio Promocional",
    popular: true
  }

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <img src="/GynSys.png" alt="GynSys Logo" className="w-10 h-10 object-contain rounded-xl" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
                GynSys
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Funcionalidades</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Plan Único</a>
              {isAuthenticated ? (
                <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                  Dashboard
                </Link>
              ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="bg-indigo-50 text-indigo-700 px-6 py-2.5 rounded-full font-bold hover:bg-indigo-100 transition-all">
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm tracking-wide uppercase">
            Suscripción Única: $9.99/mes (Costo Promocional)
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-8">
            Tu práctica médica, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              ahora en el bolsillo
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Consigue tu propia App profesional y ofrece a tus pacientes el control prenatal y menstrual con "Mi Ciclo". Todo integrado por un precio increíble.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register?type=doctor" className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center">
              Suscribirme por $9.99
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-10 py-4 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-black text-lg hover:border-indigo-200 transition-all">
              Explorar App
            </a>
          </div>

          {/* Hero Mockup Placeholder */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full"></div>
            <img
              src="/saas_landing_hero_bg"
              alt="GynSys Dashboard App"
              className="relative rounded-3xl shadow-2xl border border-gray-100 w-full object-cover h-[500px]"
              onError={(e) => { e.target.src = 'https://placehold.co/1200x600/6366f1/ffffff?text=GynSys+App+Experience' }}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">La solución completa para ginecólogas</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
              Hardware no incluido, pero el software es lo mejor del mercado.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group">
                <div className="p-3 bg-indigo-50 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Single Plan */}
      <section id="pricing" className="py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">Todo incluido, un solo precio</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">Olvídate de elegir entre planes complicados. Accede a todo GynSys por una fracción del costo.</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative p-10 rounded-[40px] border bg-indigo-600 text-white border-transparent shadow-2xl shadow-indigo-200 scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white px-6 py-1.5 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                Oferta de Lanzamiento
              </div>
              <div className="mb-8">
                <h3 className="text-3xl font-black mb-2">{promotionalPlan.name}</h3>
                <p className="text-sm text-indigo-100 font-medium">
                  {promotionalPlan.description}
                </p>
              </div>
              <div className="mb-8">
                <span className="text-gray-300 line-through text-2xl mr-2">$49.99</span>
                <span className="text-6xl font-black">${promotionalPlan.price}</span>
                <span className="text-lg font-bold ml-1 text-indigo-200">/mes</span>
              </div>
              <ul className="space-y-4 mb-10">
                {promotionalPlan.features.map((feature, j) => (
                  <li key={j} className="flex items-center font-bold text-sm">
                    <div className="p-1 rounded-full mr-3 bg-white/20">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/register?type=doctor&plan=2"
                className="block w-full text-center py-5 bg-white text-indigo-600 rounded-2xl font-black text-xl hover:bg-gray-50 shadow-lg transition-all"
              >
                {promotionalPlan.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 blur-3xl rounded-full"></div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 relative z-10">
            ¿Lista para transformar <br />tu consulta por solo $9.99?
          </h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto font-medium relative z-10">
            Agiliza tu trabajo, profesionaliza tu marca y ofrece el mejor control a tus pacientes con GynSys.
          </p>
          <Link to="/register?type=doctor" className="inline-flex items-center px-12 py-5 bg-white text-indigo-600 rounded-3xl font-black text-xl hover:bg-gray-50 transition-all shadow-xl shadow-black/20 relative z-10">
            Empezar mi suscripción
            <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-gray-500 font-bold text-sm">
          <div className="flex items-center space-x-2">
            <img src="/GynSys.png" alt="GynSys Logo" className="w-6 h-6 object-contain rounded-lg" />
            <span>© 2024 GynSys SaaS System.</span>
          </div>
          <div className="flex space-x-8">
            <a href="#" className="hover:text-indigo-600 transition-colors">Términos</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

