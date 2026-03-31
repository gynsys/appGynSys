import React, { useState, useEffect } from 'react';
import { 
  FiSend, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, 
  FiFileText, FiLayers, FiMessageSquare, FiMail, FiBell, 
  FiChevronRight, FiCheck, FiUsers, FiSearch, FiTrash2, FiUserPlus, FiRefreshCw, FiMinus
} from 'react-icons/fi';
import { campaignService } from '../../services/campaignService';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';

export default function CampaignsPage() {
  const { isDarkTheme, primaryColor = '#4F46E5' } = useOutletContext();
  const [activeTab, setActiveTab] = useState('new');
  const [sources, setSources] = useState([]);
  const [history, setHistory] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Selection / Contacts State
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '' });

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
      const [sourcesData, historyData, contactsData] = await Promise.all([
        campaignService.getSources(),
        campaignService.getCampaigns(),
        campaignService.getContacts()
      ]);
      setSources(sourcesData);
      setHistory(historyData);
      setContacts(contactsData || []);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    try {
      const result = await campaignService.syncContacts();
      toast.success(`Sincronización exitosa (+${result.added} contactos)`);
      fetchData();
    } catch (error) {
      toast.error("Error al sincronizar");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.full_name || !newContact.email) return toast.warning("Nombre y Email son obligatorios");
    try {
      await campaignService.createContact(newContact);
      toast.success("Contacto añadido");
      setNewContact({ full_name: '', email: '', phone: '' });
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al añadir");
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm("¿Eliminar contacto?")) return;
    try {
      await campaignService.deleteContact(id);
      toast.success("Eliminado");
      fetchData();
    } catch (error) {
      toast.error("Error");
    }
  };

  const toggleAllSelection = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map(c => c.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.content_html) return toast.warning("Completa todos los campos");
    if (formData.target_type === 'selection' && selectedContactIds.length === 0) return toast.warning("Selecciona al menos un destinatario");

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        selected_contact_ids: formData.target_type === 'selection' ? selectedContactIds : null
      };
      await campaignService.createCampaign(payload);
      toast.success("Campaña en cola");
      setActiveTab('history');
      fetchData();
      setSelectedContactIds([]);
    } catch (error) {
      toast.error("Error al enviar");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isFetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className={`relative overflow-hidden rounded-3xl p-8 transition-all duration-500 shadow-xl ${isDarkTheme ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-500'} text-white`}>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <FiSend className="w-8 h-8 animate-pulse" />
            Campañas de Difusión
          </h1>
          <p className="text-indigo-100 max-w-xl opacity-90">
            Conecta con tus pacientes de forma masiva. Envía promociones, noticias o recomendaciones directo a su Email y App GynSys.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('new')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white dark:bg-gray-700 shadow-md text-indigo-600' : 'text-gray-500'}`}><FiPlus /> Nueva Campaña</button>
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 shadow-md text-indigo-600' : 'text-gray-500'}`}><FiClock /> Historial</button>
      </div>

      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Recipient Selection logic */}
                <div className="space-y-4">
                  <h2 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 text-[10px]">1</span>
                    ¿A quién enviamos?
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'app_users', label: 'Usuarios App' },
                      { id: 'patients', label: 'Pacientes' },
                      { id: 'selection', label: `Personalizar (${selectedContactIds.length})` }
                    ].map(t => (
                      <button 
                        key={t.id} type="button" onClick={() => setFormData({...formData, target_type: t.id})}
                        className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.target_type === t.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Integrated Contact List - ONLY visible if Selection is active */}
                  {formData.target_type === 'selection' && (
                    <div className="mt-6 space-y-4 animate-fade-in border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-900/20">
                       <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="relative flex-1 min-w-[200px]">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="text" placeholder="Buscar contactos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={handleSyncContacts} disabled={isSyncing} className="p-2 bg-white dark:bg-gray-800 rounded-lg text-indigo-600 border border-indigo-100" title="Sincronizar base de datos">
                              {isSyncing ? <FiRefreshCw className="animate-spin" /> : <FiRefreshCw />}
                            </button>
                            <button type="button" onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1">
                              <FiPlus /> AÑADIR
                            </button>
                          </div>
                       </div>

                       <div className="max-h-[300px] overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <table className="w-full text-left border-collapse text-xs">
                             <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 shadow-sm">
                                <tr>
                                   <th className="p-3 w-8">
                                     <button type="button" onClick={toggleAllSelection} className={`w-4 h-4 rounded border flex items-center justify-center ${selectedContactIds.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                       {selectedContactIds.length === filteredContacts.length && selectedContactIds.length > 0 && <FiCheck className="w-3 h-3" />}
                                       {selectedContactIds.length > 0 && selectedContactIds.length < filteredContacts.length && <FiMinus className="w-3 h-3" />}
                                     </button>
                                   </th>
                                   <th className="p-3 font-black text-gray-400 uppercase text-[9px]">Nombre</th>
                                   <th className="p-3 font-black text-gray-400 uppercase text-[9px] hidden md:table-cell">Email</th>
                                   <th className="p-3 text-right"></th>
                                </tr>
                             </thead>
                             <tbody>
                                {filteredContacts.map(c => (
                                  <tr key={c.id} onClick={() => setSelectedContactIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])} className={`border-t border-gray-50 dark:border-gray-700 transition-colors cursor-pointer hover:bg-indigo-50/20 ${selectedContactIds.includes(c.id) ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="p-3">
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedContactIds.includes(c.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                        {selectedContactIds.includes(c.id) && <FiCheck className="w-3 h-3" />}
                                      </div>
                                    </td>
                                    <td className="p-3 font-bold">{c.full_name}</td>
                                    <td className="p-3 text-gray-500 hidden md:table-cell">{c.email}</td>
                                    <td className="p-3 text-right">
                                      <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteContact(c.id); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><FiTrash2 /></button>
                                    </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                          {filteredContacts.length === 0 && <div className="p-8 text-center text-gray-400 italic">No hay contactos</div>}
                       </div>
                    </div>
                  )}
                </div>

                {/* 2. Message Content */}
                <div className="space-y-4">
                   <h2 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 text-[10px]">2</span>
                    ¿Qué quieres contar?
                  </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select 
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setFormData({...formData, source_type: 'custom', source_id: null, title: '', subject: '', content_html: ''});
                          } else {
                            const [type, id] = e.target.value.split(':');
                            const src = sources.find(s => s.id === parseInt(id) && s.type === type);
                            if (src) setFormData({...formData, source_type: type, source_id: src.id, title: `Campaña: ${src.title}`, subject: src.title, content_html: `Hola! Te invito a leer: "${src.title}"`});
                          }
                        }}
                        className="p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 transition-all font-bold text-xs"
                      >
                         <option value="custom">Escribir desde cero (Mensaje Libre)</option>
                         <optgroup label="Blog">
                             {sources.filter(s => s.type === 'blog').map(s => <option key={s.id} value={`blog:${s.id}`}>{s.title}</option>)}
                         </optgroup>
                         <optgroup label="Recomendaciones">
                             {sources.filter(s => s.type === 'recommendation').map(s => <option key={s.id} value={`recommendation:${s.id}`}>{s.title}</option>)}
                         </optgroup>
                      </select>
                      <input type="text" placeholder="Título interno de la campaña" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="p-4 rounded-xl bg-gray-50 border-2 border-gray-100 text-xs font-bold" />
                   </div>
                   
                   <input type="text" placeholder="Asunto (Visto por el paciente)" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 text-xs font-bold" />
                   
                   <textarea rows={6} placeholder="Cuerpo del mensaje (acepta HTML)..." value={formData.content_html} onChange={(e) => setFormData({...formData, content_html: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 text-xs font-medium resize-none shadow-inner" />
                </div>

                <button disabled={isLoading} className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest">
                  {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><FiSend className="w-5 h-5" /> Lanzar Campaña</>}
                </button>
              </form>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Vista Previa</h2>
            <div className={`rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
               <div className="p-3 border-b flex items-center gap-2"><FiMail className="text-indigo-500" /><span className="text-[10px] font-black uppercase">Email</span></div>
               <div className="p-6">
                  <div className="font-bold text-xs mb-3 truncate">{formData.subject || 'Sin asunto'}</div>
                  <div className="p-4 rounded-xl border border-dashed border-gray-100 dark:border-gray-700 min-h-[100px] text-[10px] prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formData.content_html || '<p class="italic text-gray-300">Mensaje vacío...</p>' }} />
               </div>
            </div>
            <div className={`rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
               <div className="p-3 border-b flex items-center gap-2"><FiBell className="text-indigo-500" /><span className="text-[10px] font-black uppercase">Notificación App</span></div>
               <div className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">G</div>
                  <div className="overflow-hidden flex-1">
                     <div className="font-black text-[10px] truncate">{formData.subject || 'GynSys'}</div>
                     <div className="text-[9px] text-gray-400 line-clamp-2 mt-0.5">{formData.content_html.replace(/<[^>]+>/g, '') || 'Resumen...'}</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Section */
        <div className="space-y-4 animate-fade-in pb-10">
          {history.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed">
              <FiMessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm italic">No se han registrado campañas</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border-2 border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 shadow-sm flex items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{item.status === 'sent' ? <FiCheckCircle /> : <FiClock className="animate-spin" />}</div>
                   <div>
                      <h3 className="font-black text-xs uppercase tracking-tight">{item.title}</h3>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[9px] font-bold text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${item.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status === 'sent' ? 'Enviado' : 'Pendiente'}</span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase bg-indigo-50 px-2 py-0.5 rounded-full">{item.target_type}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-4 px-4 border-l">
                   <div className="text-center">
                      <div className="text-lg font-black text-indigo-600">{item.stats?.sent_count || 0}</div>
                      <div className="text-[8px] font-black text-gray-400 uppercase">Destinatarios</div>
                   </div>
                   <FiChevronRight className="text-gray-300" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Manual Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm p-8 rounded-3xl shadow-2xl ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
             <h3 className="text-xl font-black mb-6 text-indigo-600 uppercase flex items-center gap-2"><FiUserPlus /> Nuevo Contacto</h3>
             <form onSubmit={handleAddContact} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-gray-400 px-1">Nombre Completo</span>
                  <input type="text" placeholder="Ej: Maria Lopez" value={newContact.full_name} onChange={(e) => setNewContact({...newContact, full_name: e.target.value})} className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-gray-400 px-1">Email</span>
                  <input type="email" placeholder="maria@ejemplo.com" value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-gray-400 px-1">Teléfono (opcional)</span>
                  <input type="text" placeholder="+54 9 11..." value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 font-bold text-xs" />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-bold text-gray-500">Cerrar</button>
                   <button className="flex-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-500/30">GUARDAR</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
