import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { arkoService } from '../services/arkoService';
import Button from '../../../components/common/Button';
import { useToastStore } from '../../../store/toastStore';
import GynSysLoader from '../../../components/common/GynSysLoader';

export default function ArkoProfileManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToastStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      siteName: '',
      logoUrl: '',
      primaryColor: '#F59E0B',
      contactPhone: '',
      contactEmail: '',
      address: ''
    }
  });

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

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mi Perfil (Configuración del Sitio)</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Identidad Visual */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
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

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} primaryColor="#F59E0B">
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>

      </form>
    </div>
  );
}
