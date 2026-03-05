import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Heart, Baby, Bell, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { FiActivity } from 'react-icons/fi';
import { User } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import ScrollReveal from '../common/ScrollReveal';
import CycleAuthDialog from '../cycle-predictor/CycleAuthDialog';

export default function CycleMarketingSection({ primaryColor, theme, containerBgColor, doctorSlug }) {
    const navigate = useNavigate();
    const [showRegister, setShowRegister] = useState(false);

    const features = [
        {
            icon: <Calendar className="w-5 h-5" style={{ color: primaryColor }} />,
            title: "Control Menstrual Inteligente",
            desc: "Predicciones precisas de tu periodo y ventana de fertilidad."
        },
        {
            icon: <Baby className="w-5 h-5" style={{ color: primaryColor }} />,
            title: "Asistente Prenatal",
            desc: "Seguimiento semana a semana de tu embarazo con hitos médicos."
        },
        {
            icon: <Heart className="w-5 h-5" style={{ color: primaryColor }} />,
            title: "Registro de Síntomas",
            desc: "Diario íntimo para entender patrones de tu salud física y emocional."
        },
        {
            icon: <ShieldCheck className="w-5 h-5" style={{ color: primaryColor }} />,
            title: "Privacidad Total",
            desc: "Tus datos están seguros y protegidos bajo los más altos estándares."
        }
    ];

    return (
        <ScrollReveal variant="fade-up" delay={0.1}>
            <SectionCard
                id="mi-ciclo-app"
                theme={theme}
                containerBgColor={containerBgColor}
                title="Mi Ciclo"
                className="overflow-hidden"
            >
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[500px] lg:min-h-[578px] px-2">

                    {/* Left: Text Content & SEO */}
                    <div className="lg:w-[55%] space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                Tu Compañera de Salud <br />
                                <span style={{ color: primaryColor }}>Femenina en cada Etapa</span>
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                                Gestiona tu bienestar con nuestra herramienta integral. Desde el control menstrual hasta el seguimiento prenatal, diseñada por expertos para acompañarte siempre.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-start space-x-3 group">
                                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:scale-110 transition-transform duration-300">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{feature.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 flex-wrap">
                            <button
                                id="mi-ciclo-open-btn"
                                onClick={() => navigate('/cycle/dashboard')}
                                className="w-full sm:w-auto px-7 py-3.5 rounded-full font-bold text-white shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <FiActivity className="w-4 h-4" />
                                Abrir Mi Ciclo
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                id="mi-ciclo-register-btn"
                                onClick={() => setShowRegister(true)}
                                className="w-full sm:w-auto px-7 py-3.5 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group border-2"
                                style={{
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                    background: 'transparent',
                                }}
                            >
                                <UserPlus className="w-4 h-4" />
                                Registrarse gratis
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium pt-1">
                            * Acceso gratuito e inmediato · Sin tarjeta de crédito
                        </p>
                    </div>

                    {/* Right: Mockup / Visual (Simulated Dashboard) */}
                    <div className="lg:w-[45%] w-full relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-indigo-500/10 rounded-3xl blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Styled Dashboard Simulation */}
                        <div className="relative bg-gray-900 rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl p-6 aspect-[9/16] max-w-[320px] mx-auto overflow-hidden">
                            <div className="space-y-6">
                                {/* Header Mock */}
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                                            <Heart className="w-4 h-4 text-pink-500" />
                                        </div>
                                        <span className="text-white text-xs font-bold">Mi Ciclo</span>
                                    </div>
                                    <Bell className="w-4 h-4 text-gray-500" />
                                </div>

                                {/* Main Circle Mock */}
                                <div className="aspect-square rounded-full border-[10px] border-pink-500/20 flex flex-col items-center justify-center text-center p-8 relative">
                                    <div className="absolute inset-0 border-[10px] border-pink-500 rounded-full clip-path-75 opacity-50" />
                                    <span className="text-pink-500 text-xs font-bold uppercase tracking-widest">Día 14</span>
                                    <span className="text-white text-3xl font-black my-1">Fértil</span>
                                    <span className="text-gray-400 text-[10px]">Probabilidad Alta</span>
                                </div>

                                {/* Pills Mock */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-14 bg-gray-800/50 rounded-2xl p-3 flex flex-col justify-center">
                                        <span className="text-white text-[10px] font-bold">Calendario</span>
                                        <span className="text-gray-500 text-[9px]">Próximo: 12 Nov</span>
                                    </div>
                                    <div className="h-14 bg-pink-500/10 rounded-2xl p-3 flex flex-col justify-center">
                                        <span className="text-pink-400 text-[10px] font-bold">Registro</span>
                                        <span className="text-gray-500 text-[9px]">Síntomas hoy</span>
                                    </div>
                                </div>

                                {/* Bottom Nav Mock */}
                                <div className="absolute bottom-6 left-0 right-0 px-6">
                                    <div className="flex justify-between items-center bg-gray-800/80 backdrop-blur-md rounded-2xl p-3">
                                        <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center">
                                            <Calendar className="w-3 h-3 text-pink-500" />
                                        </div>
                                        <Heart className="w-3 h-3 text-gray-500" />
                                        <Bell className="w-3 h-3 text-gray-500" />
                                        <User className="w-3 h-3 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badges */}
                        <div className="absolute -top-4 -right-4 md:-right-8 animate-bounce-slow">
                            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-4 flex items-center gap-3 border dark:border-gray-700">
                                <div className="bg-green-100 p-2 rounded-full">
                                    <ShieldCheck className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Validado por</p>
                                    <p className="text-xs font-black text-gray-800 dark:text-gray-200 leading-none">Especialistas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Registration modal */}
            <CycleAuthDialog
                open={showRegister}
                onOpenChange={setShowRegister}
                initialView="register"
                slug={doctorSlug}
            />
        </ScrollReveal>
    );
}
