import { useState, useEffect } from 'react';
import { arkoService } from '../services/arkoService';
import Button from '../../../components/common/Button';
import { useToastStore } from '../../../store/toastStore';
import GynSysLoader from '../../../components/common/GynSysLoader';
import { FiCheck, FiX } from 'react-icons/fi';

export default function ArkoToolsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const { showToast } = useToastStore();

  const [tools, setTools] = useState({
    mixDesign: true,
    wallCalculator: false,
    budgetEstimator: false
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await arkoService.getSiteConfig();
      setConfig(data || {});
      if (data && data.tools) {
        setTools(prev => ({ ...prev, ...data.tools }));
      }
    } catch (error) {
      console.error('Error loading config:', error);
      showToast('Error al cargar herramientas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (toolKey) => {
    setTools(prev => ({
      ...prev,
      [toolKey]: !prev[toolKey]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedConfig = { ...config, tools };
      await arkoService.updateSiteConfig(updatedConfig);
      setConfig(updatedConfig);
      showToast('Herramientas actualizadas', 'success');
    } catch (error) {
      console.error('Error saving tools config:', error);
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GynSysLoader />;

  const toolList = [
    { key: 'mixDesign', name: 'Calculadora de Diseño de Mezclas', desc: 'Herramienta para dosificación de concreto basada en análisis probabilístico.' },
    { key: 'wallCalculator', name: 'Cálculo de Muros de Gravedad', desc: 'Herramienta para diseño y cálculo de empujes (Próximamente).' },
    { key: 'budgetEstimator', name: 'Estimador de Presupuestos', desc: 'Generador de presupuestos automatizado (Próximamente).' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Herramientas</h2>
        <Button onClick={handleSave} disabled={saving} primaryColor="#F59E0B">
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {toolList.map((tool) => (
            <li key={tool.key} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{tool.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tool.desc}</p>
              </div>
              
              <button
                type="button"
                onClick={() => handleToggle(tool.key)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                  ${tools[tool.key] ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out flex items-center justify-center
                    ${tools[tool.key] ? 'translate-x-5' : 'translate-x-0'}
                  `}
                >
                  {tools[tool.key] ? (
                    <FiCheck className="h-3 w-3 text-amber-500" />
                  ) : (
                    <FiX className="h-3 w-3 text-gray-400" />
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
