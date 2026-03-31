import React, { useState, useEffect } from 'react';
import { 
  FiSend, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, 
  FiFileText, FiLayers, FiMessageSquare, FiMail, FiBell, FiChevronRight, FiCheck
} from 'react-icons/fi';
import { campaignService } from '../../services/campaignService';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';

export default function CampaignsPage() {
  const { isDarkTheme, primaryColor = '#4F46E5' } = useOutletContext();
  const [activeTab, setActiveTab] = useState('new');
  const [sources, setSources] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content_html: '',
    source_type: 'custom',
    source_id: null,
    target_type: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [sourcesData, historyData] = await Promise.all([
        campaignService.getSources(),
        campaignService.getCampaigns()
      ]);
      setSources(sourcesData);
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching data", error);
      toast.error("Error al cargar datos");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSourceSelect = (source) => {
    if (source === 'custom') {
      setFormData({
        ...formData,
        source_type: 'custom',
        source_id: null,
        title: '',
        subject: '',
        content_html: ''
      });
    } else {
      setFormData({
        ...formData,
        source_type: source.type,
        source_id: source.id,
        title: `Campaña: ${source.title}`,
        subject: source.title,
        content_html: `Hola, te invito a ver mi última publicación: "${source.title}". \n\n${source.summary || ''}`
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.content_html) {
      toast.warning("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);
    try {
      await campaignService.createCampaign(formData);
      toast.success("¡Campaña enviada a la cola de procesamiento!");
      setActiveTab('history');
      fetchData();
      // Reset form
      setFormData({
        title: '',
        subject: '',
        content_html: '',
        source_type: 'custom',
        source_id: null,
        target_type: 'all'
      });
    } catch (error) {
      console.error("Error creating campaign", error);
      toast.error("Error al enviar la campaña");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header with Animation */}
      <div className={`relative overflow-hidden rounded-3xl p-8 transition-all duration-500 shadow-xl ${isDarkTheme ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-500'} text-white`}>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <FiSend className="w-8 h-8 animate-pulse" />
            Campañas de Difusión
          </h1>
          <p className="text-indigo-100 max-w-xl opacity-90">
            Conecta con tus pacientes de forma masiva. Envía promociones, noticias del blog o recomendaciones de salud directamente a su Email y App GynSys.
          </p>
        </div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
      </div>

      {/* Tabs Layout */}
      <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('new')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white dark:bg-gray-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <FiPlus /> Nueva Campaña
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <FiClock /> Historial
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-8 rounded-3xl animate-fade-in shadow-sm border border-gray-100 dark:border-gray-700/50 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">1</span>
                Diseña tu Mensaje
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Source Selection */}
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-3 block">Fuente del Contenido</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      type="button"
                      onClick={() => handleSourceSelect('custom')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.source_type === 'custom' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                    >
                      <FiMessageSquare className="w-5 h-5 text-indigo-500" />
                      <span className="text-xs font-bold">Mensaje Libre</span>
                    </button>
                    <div className="col-span-2 relative group">
                      <select 
                        onChange={(e) => {
                          const id = parseInt(e.target.value);
                          const src = sources.find(s => s.id === id && s.type === e.target.selectedOptions[0].dataset.type);
                          if (src) handleSourceSelect(src);
                        }}
                        className={`w-full p-4 rounded-2xl border-2 appearance-none h-full transition-all text-xs font-bold ${formData.source_type !== 'custom' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700'}`}
                      >
                        <option value="">Cargar del Blog o Recomendación...</option>
                        <optgroup label="Artículos del Blog">
                          {sources.filter(s => s.type === 'blog').map(s => (
                            <option key={`blog-${s.id}`} value={s.id} data-type="blog">{s.title}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Recomendaciones">
                          {sources.filter(s => s.type === 'recommendation').map(s => (
                            <option key={`recom-${s.id}`} value={s.id} data-type="recommendation">{s.title}</option>
                          ))}
                        </optgroup>
                      </select>
                      <FiLayers className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Título de Campaña (Interno)</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej: Invitación Blog - Prevención Cáncer"
                    className="w-full p-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Asunto (Para el Paciente)</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Ej: Hola! Tengo un nuevo artículo para ti..."
                    className="w-full p-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Cuerpo del Mensaje (HTML)</label>
                  <textarea 
                    rows={6}
                    value={formData.content_html}
                    onChange={(e) => setFormData({...formData, content_html: e.target.value})}
                    placeholder="Escribe el contenido aquí..."
                    className="w-full p-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 italic">Acepta etiquetas HTML básicas para formato.</p>
                </div>

                <div className="pt-4">
                   <button 
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <FiSend className="w-5 h-5" />
                        Lanzar Campaña Ahora
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview Side */}
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 text-gray-400 uppercase text-xs">Vista Previa</h2>
            
            {/* Email Preview */}
            <div className={`rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <FiMail className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase">Vista previa Email</span>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span className="text-[10px] text-gray-400 block mb-1">ASUNTO:</span>
                  <div className="font-bold text-sm truncate">{formData.subject || '(Sin asunto)'}</div>
                </div>
                <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 min-h-[150px]">
                  <div 
                    className="text-sm prose prose-indigo max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: formData.content_html || '<p class="text-gray-400 italic">Escribe algo para previsualizar...</p>' }}
                  />
                  {formData.source_type !== 'custom' && (
                    <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold text-center">
                      Botón de ver {formData.source_type} incluido
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Push Preview */}
            <div className={`rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm ${isDarkTheme ? 'bg-gray-800' : 'bg-white'} relative`}>
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <FiBell className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase">Notificación App</span>
                </div>
                <div className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">G</div>
                    <div className="overflow-hidden">
                        <div className="font-black text-sm">{formData.subject || 'Notificación GynSys'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {formData.content_html.replace(/<[^>]+>/g, '') || 'Resumen del mensaje...'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                <p className="text-[10px] text-amber-700 dark:text-amber-500 flex items-start gap-2">
                    <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                    Las campañas tardan un promedio de 5-10 minutos en llegar a todos los pacientes dependiendo del tamaño de tu base de datos.
                </p>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4 animate-fade-in">
          {history.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
              <FiMessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-500">Aún no has enviado campañas</h3>
              <p className="text-sm text-gray-400">Tus envíos masivos aparecerán aquí para seguimiento.</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className={`p-6 rounded-2xl border transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      {item.status === 'sent' ? <FiCheckCircle /> : <FiClock className="animate-spin" />}
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight">{item.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                          <FiClock /> {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${item.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status === 'sent' ? 'Enviado' : 'Procesando'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{item.stats?.sent_count || 0}</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase">Totales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-gray-700 dark:text-gray-200">{item.stats?.push_count || 0}</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase truncate max-w-[50px]">Push</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-gray-700 dark:text-gray-200">{item.stats?.email_count || 0}</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase truncate max-w-[50px]">Email</div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <FiChevronRight className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
