import React, { useState } from 'react';
import { 
  UserCircle, 
  MapPin, 
  Stethoscope, 
  Video, 
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// Import All Configuration Components
import ProfileEditorPage from '../ProfileEditorPage';
import LocationsManager from './LocationsManager';
import ServicesManager from './ServicesManager';
import OnlineConsultationSettings from './OnlineConsultationSettings';
import PreconsultationConfigPage from './PreconsultationConfigPage';
import PdfConfigurationPage from './PdfConfigurationPage';
import RecommendationsManager from './RecommendationsManager';
import GalleryManager from './GalleryManager';

const STEPS = [
  { id: 1, title: 'Mi Perfil', icon: UserCircle, description: 'Datos personales y plan' },
  { id: 2, title: 'Ubicaciones', icon: MapPin, description: 'Consultorios físicos' },
  { id: 3, title: 'Servicios', icon: Stethoscope, description: 'Tratamientos y precios' },
  { id: 4, title: 'Telemedicina', icon: Video, description: 'Citas online y preconsulta' },
  { id: 5, title: 'Documentos', icon: FileText, description: 'Firmas y PDFs' },
  { id: 6, title: 'Extras', icon: ImageIcon, description: 'Galería y Recomendaciones' },
];

export default function QuickSetupPage() {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('quick_setup_step');
    return saved ? parseInt(saved) : 1;
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      const next = currentStep + 1;
      setCurrentStep(next);
      localStorage.setItem('quick_setup_step', next.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      localStorage.setItem('quick_setup_step', prev.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">👋 ¡Bienvenido/a a tu configuración!</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Completa tu perfil. Recuerda hacer clic en "Guardar Datos" dentro de cada pestaña antes de pasar al siguiente paso.
              </p>
            </div>
            {/* Wrapper to ensure it takes natural height without breaking layout */}
            <div className="quick-setup-wrapper">
              <ProfileEditorPage isQuickSetup={true} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="quick-setup-wrapper space-y-6">
            <LocationsManager isQuickSetup={true} />
          </div>
        );
      case 3:
        return (
          <div className="quick-setup-wrapper space-y-6">
            <ServicesManager isQuickSetup={true} />
          </div>
        );
      case 4:
        return (
          <div className="quick-setup-wrapper space-y-12">
             <OnlineConsultationSettings isQuickSetup={true} />
             <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
                <PreconsultationConfigPage isQuickSetup={true} />
             </div>
          </div>
        );
      case 5:
        return (
          <div className="quick-setup-wrapper space-y-6">
            <PdfConfigurationPage isQuickSetup={true} />
          </div>
        );
      case 6:
        return (
          <div className="quick-setup-wrapper space-y-12">
             <GalleryManager isQuickSetup={true} />
             <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
                <RecommendationsManager isQuickSetup={true} />
             </div>
             
             <div className="mt-8 bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-800 dark:text-green-300">¡Configuración Completada!</h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Tu clínica virtual ya está lista para recibir pacientes.
                </p>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header & Stepper */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Asistente de Configuración
        </h1>
        
        {/* Desktop Stepper */}
        <div className="hidden md:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative z-10 w-32">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                      ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                        'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'}`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-semibold mt-2 text-center
                    ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 
                      isCompleted ? 'text-green-600 dark:text-green-500' : 
                      'text-gray-500 dark:text-gray-400'}`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-colors duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} 
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Stepper */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Paso {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {STEPS[currentStep - 1].title}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="transition-all duration-300 relative">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-colors
            ${currentStep === 1 
              ? 'text-gray-400 cursor-not-allowed hidden sm:flex' 
              : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </button>

        <div className="flex items-center gap-3 ml-auto">
          {currentStep === STEPS.length ? (
            <button
               onClick={() => {
                   localStorage.removeItem('quick_setup_step');
                   // Redirigir al inicio del dashboard
                   window.location.href = '/dashboard';
               }}
               className="flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              Finalizar Configuración
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              Siguiente Paso
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
