import { useState } from 'react'
import { Link } from 'react-router-dom'
import LoginModal from '../components/features/LoginModal'

export default function PricingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const plans = [
    {
      name: 'Básico',
      price: '$29',
      period: 'mes',
      features: [
        'Página web personalizada',
        'Gestión de citas',
        'Blog con IA',
        'Formularios de pre-consulta',
        'Soporte por email',
      ],
      popular: false,
    },
    {
      name: 'Profesional',
      price: '$59',
      period: 'mes',
      features: [
        'Todo lo del plan Básico',
        'Personalización avanzada',
        'Analytics de visitas',
        'Soporte prioritario',
        'Integraciones adicionales',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      features: [
        'Todo lo del plan Profesional',
        'Múltiples ubicaciones',
        'API personalizada',
        'Soporte 24/7',
        'Gestor de cuenta dedicado',
      ],
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              GynSys
            </Link>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </button>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Registrarse
              </Link>
            </nav>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Planes y Precios
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg p-8 ${plan.popular
                ? 'ring-2 ring-indigo-600 transform scale-105'
                : ''
                }`}
            >
              {plan.popular && (
                <div className="text-center mb-4">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-indigo-600 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block w-full text-center py-3 px-4 rounded-lg font-medium ${plan.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
              >
                Comenzar
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

