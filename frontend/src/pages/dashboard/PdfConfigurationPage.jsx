import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { ImageUpload } from '../../components/common/ImageUpload';
import { doctorService } from '../../services/doctorService';

export default function PdfConfigurationPage() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    doctor_name: '',
    specialty: '',
    location: '',
    phones: '',
    mpps_number: '',
    cmdm_number: '',
    doctor_id: '', // CI
    report_title: 'HISTORIA MEDICA',
    footer_city: '',
    logo_header_1: '',
    logo_signature: '',
    include_functional_exam: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = await doctorService.getCurrentUser();
        if (user.pdf_config) {
          setSettings(prev => ({
            ...prev,
            ...user.pdf_config,
            // Prioritize pdf_config logo if set, otherwise fallback to user profile logo
            logo_header_1: user.pdf_config.logo_header_1 || (user.logo_url ? user.logo_url : '')
          }));
        } else {
          // Default values if nothing stored
          setSettings(prev => ({
            ...prev,
            doctor_name: user.nombre_completo || 'Dra. Mariel Herrera',
            specialty: user.especialidad || 'Especialista en Ginecología y Obstetricia',
            location: 'Caracas-Guarenas Guatire',
            phones: '04244281876-04127738918',
            mpps_number: '140.795',
            cmdm_number: '38.789',
            doctor_id: '23.812.988',
            footer_city: 'Guarenas',
            logo_header_1: user.logo_url || ''
          }));
        }
      } catch (error) {
        // Fallback to localStorage if API fails or offline
        const storedSettings = localStorage.getItem('pdf_settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = async (field, file, previewUrl) => {
    // If file is null, it means the image was removed.
    if (file) {
      try {
        let responseUrl = previewUrl;

        if (field === 'logo_header_1') {
          const response = await doctorService.uploadLogo(file);
          responseUrl = response.logo_url;
          showToast('Logo subido exitosamente', 'success');
        } else if (field === 'logo_signature') {
          const response = await doctorService.uploadSignature(file);
          responseUrl = response.signature_url;
          showToast('Firma subida exitosamente', 'success');
        }

        setSettings(prev => ({
          ...prev,
          [field]: responseUrl
        }));
      } catch (error) {
        showToast('Error al subir la imagen', 'error');
      }
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save to API
      await doctorService.updateCurrentUser({ pdf_config: settings });

      // Also save to localStorage as backup/cache
      localStorage.setItem('pdf_settings', JSON.stringify(settings));

      showToast('Configuración guardada exitosamente', 'success');
    } catch (error) {
      showToast('Error al guardar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración de PDF</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FiSave />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Datos del Médico</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Información que aparecerá en el encabezado del informe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Doctor</label>
              <input
                type="text"
                name="doctor_name"
                value={settings.doctor_name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidad</label>
              <input
                type="text"
                name="specialty"
                value={settings.specialty}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cédula (CI)</label>
              <input
                type="text"
                name="doctor_id"
                value={settings.doctor_id}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MPPS</label>
              <input
                type="text"
                name="mpps_number"
                value={settings.mpps_number}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CMDM</label>
              <input
                type="text"
                name="cmdm_number"
                value={settings.cmdm_number}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfonos</label>
              <input
                type="text"
                name="phones"
                value={settings.phones}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación / Dirección</label>
              <input
                type="text"
                name="location"
                value={settings.location}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 mt-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Configuración del Informe</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personalización del documento PDF.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Reporte</label>
              <input
                type="text"
                name="report_title"
                value={settings.report_title}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad (Pie de página)</label>
              <input
                type="text"
                name="footer_city"
                value={settings.footer_city}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 mt-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Imágenes y Logos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Arrastra y suelta tus imágenes para el encabezado y firma.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ImageUpload
              label="Logo del Encabezado"
              currentImage={settings.logo_header_1}
              onImageChange={(file, url) => handleImageChange('logo_header_1', file, url)}
            />

            <ImageUpload
              label="Firma Digital"
              currentImage={settings.logo_signature}
              onImageChange={(file, url) => handleImageChange('logo_signature', file, url)}
            />
          </div>

        </form>
      </div>
    </div>
  );
}
