import { useState, useEffect } from 'react'
import { X, CheckCircle2, Globe, Calendar, Clipboard, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WelcomeTourModal({ doctor }) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Check if it's a first-time login for a new user
        const hasSeenTour = localStorage.getItem('has_seen_welcome_tour')
        const isNewUser = doctor?.status === 'active' && !hasSeenTour

        // Also consider account age if available, but for now simple flag
        if (isNewUser) {
            setIsOpen(true)
        }
    }, [doctor])

    const handleClose = () => {
        localStorage.setItem('has_seen_welcome_tour', 'true')
        setIsOpen(false)
    }

    if (!isOpen) return null

    const steps = [
        {
            icon: <Globe className="w-6 h-6 text-indigo-600" />,
            title: "Tu Sitio ya está en línea",
            description: `Los pacientes ya pueden visitarte en gynsys.net/dr/${doctor.slug_url}`,
            link: `/dr/${doctor.slug_url}`,
            linkLabel: "Ver mi sitio"
        },
        {
            icon: <Calendar className="w-6 h-6 text-indigo-600" />,
            title: "Configura tus Horarios",
            description: "Define tu disponibilidad para que tus pacientes puedan agendar solos.",
            link: "/dashboard/locations",
            linkLabel: "Configurar horarios"
        },
        {
            icon: <Clipboard className="w-6 h-6 text-indigo-600" />,
            title: "Pre-consultas Inteligentes",
            description: "Hemos activado formularios base para ahorrarte tiempo en cada consulta.",
            link: "/dashboard/preconsulta-config",
            linkLabel: "Personalizar preguntas"
        }
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl max-w-2xl w-full overflow-hidden relative border border-white/20">
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-10 md:p-12">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="p-3 bg-green-100 rounded-2xl">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                                ¡Bienvenida a GynSys, Dra. {doctor.nombre_completo.split(' ')[0]}!
                            </h2>
                            <p className="text-gray-500 font-bold">Tu plataforma SaaS está lista para recibir pacientes.</p>
                        </div>
                    </div>

                    <div className="space-y-6 mb-10">
                        {steps.map((step, i) => (
                            <div key={i} className="flex space-x-6 p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 transition-all">
                                <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm self-start">
                                    {step.icon}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{step.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium text-sm mb-3">{step.description}</p>
                                    <Link
                                        to={step.link}
                                        className="text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center hover:underline"
                                        onClick={handleClose}
                                    >
                                        {step.linkLabel} <ArrowRight className="ml-1 w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                    >
                        ¡Empecemos!
                    </button>
                </div>
            </div>
        </div>
    )
}
