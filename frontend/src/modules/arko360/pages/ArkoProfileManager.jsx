import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Palette, Phone } from 'lucide-react';
import { arkoService } from '../services/arkoService';
import Button from '../../../components/common/Button';
import { useToastStore } from '../../../store/toastStore';
import GynSysLoader from '../../../components/common/GynSysLoader';

export default function ArkoProfileManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const { showToast } = useToastStore();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      siteName: '',
      logoUrl: '',
      primaryColor: '#F59E0B',
      contactPhone: '',
      contactEmail: '',
      address: ''
    }
  });

  const primaryColor = watch('primaryColor') || '#F59E0B';

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await arkoService.getSiteConfig();
      if (config) {
        reset(config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      showToast('Error al cargar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      await arkoService.updateSiteConfig(data);
      showToast('Configuración guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Error al guardar la configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GynSysLoader />;

  const tabs = [
    { id: 'identity', label: 'Identidad', icon: <User size={20} /> },
    { id: 'appearance', label: 'Apariencia', icon: <Palette size={20} /> },
    { id: 'contact', label: 'Contacto', icon: <Phone size={20} /> }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'identity':
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Identidad Visual</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Sitio</label>
                <input 
                  {...register('siteName')}
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Ej. Arko 360"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL del Logo</label>
                <input 
                  {...register('logoUrl')}
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="/arko360/images/logo.png"
                />
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Color y Tema</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color Primario (Hex)</label>
                <div className="mt-1 flex items-center gap-3">
                  <input 
                    {...register('primaryColor')}
                    type="color" 
                    className="h-9 w-9 rounded border border-gray-300 cursor-pointer"
                  />
                  <input 
                    {...register('primaryColor')}
                    type="text" 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono (WhatsApp)</label>
                <input 
                  {...register('contactPhone')}
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="+58 412 1234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                <input 
                  {...register('contactEmail')}
                  type="email" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="contacto@arko360.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección Física</label>
                <input 
                  {...register('address')}
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <div className="flex items-center justify-between mb-8 px-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Perfil</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="grid grid-cols-3 sm:flex sm:justify-start items-center">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-6 text-[10px] sm:text-sm font-bold border-b-2 transition-colors duration-200 whitespace-nowrap
                    ${isActive
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-gray-800'
                      : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:text-gray-500 dark:hover:text-gray-200'
                    }
                  `}
                  style={isActive ? { borderColor: primaryColor, color: primaryColor } : {}}
                >
                  <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                    {tab.icon}
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form and Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Main Content Area */}
          <div className="p-6 md:p-8 min-h-[300px]">
            {renderActiveTab()}
          </div>

          {/* Global form actions (Sticky Footer) */}
          <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4 sticky bottom-0 z-10 backdrop-blur-md">
            <span className="text-xs text-gray-400 self-center hidden sm:block">
              {saving ? 'Guardando cambios...' : 'Recuerda guardar al finalizar tus cambios.'}
            </span>
            <Button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: primaryColor }}
              className="text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
