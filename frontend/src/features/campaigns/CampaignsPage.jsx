import React, { useState, useEffect } from 'react';
import { 
  FiSend, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, 
  FiFileText, FiLayers, FiMessageSquare, FiMail, FiBell, 
  FiChevronRight, FiCheck, FiUsers, FiSearch, FiTrash2, FiUserPlus, FiRefreshCw, FiMinus
} from 'react-icons/fi';
import { campaignService } from '../../services/campaignService';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { ImageUpload } from '../../components/common/ImageUpload';

export default function CampaignsPage() {
  const { isDarkTheme, primaryColor = '#4f46e5', doctor } = useOutletContext();
  
  // Helper for transparency
  const hexToRgba = (hex, alpha) => {
    try {
      if (!hex || hex === 'transparent') return 'transparent';
      let r, g, b;
      const cleanHex = hex.replace('#', '');
      if (cleanHex.length === 3) {
        r = parseInt(cleanHex.slice(0, 1).repeat(2), 16);
        g = parseInt(cleanHex.slice(1, 2).repeat(2), 16);
        b = parseInt(cleanHex.slice(2, 3).repeat(2), 16);
      } else {
        r = parseInt(cleanHex.slice(0, 2), 16);
        g = parseInt(cleanHex.slice(2, 4), 16);
        b = parseInt(cleanHex.slice(4, 6), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return hex;
    }
  };
  const [sources, setSources] = useState([]);
  const [history, setHistory] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  const [activeTab, setActiveTab] = useState('new');

  // Selection / Contacts State
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [personalizeTab, setPersonalizeTab] = useState('add'); // 'add' or 'list'
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
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
      setSources(sourcesData || []);
      setHistory(historyData || []);
      setContacts(contactsData || []);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      toast.error("Error al cargar datos de campaña");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      const response = await campaignService.uploadCampaignImage(file);
      const imageUrl = response.image_url;
      const baseUrl = `https://api.gynsys.net`;
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
      
      const imgHtml = `\n<div style="text-align: center; margin: 20px 0;"><img src="${fullImageUrl}" style="max-width: 100%; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);" alt="Imagen de campaña" /></div>\n`;
      
      setFormData(prev => ({
        ...prev,
        content_html: prev.content_html + imgHtml
      }));
      toast.success("Imagen insertada correctamente");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
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
    
    setIsSubmittingContact(true);
    try {
      const created = await campaignService.createContact(newContact);
      toast.success("Contacto añadido y seleccionado");
      
      // Auto-select the new contact
      if (created && created.id) {
        setSelectedContactIds(prev => [...new Set([...prev, created.id])]);
      }
      
      setNewContact({ full_name: '', email: '', phone: '' });
      await fetchData();
      setPersonalizeTab('list');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al añadir");
    } finally {
      setIsSubmittingContact(false);
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
      
      // Clear form after success
      setFormData({
        title: '',
        subject: '',
        content_html: '',
        source_type: 'custom',
        source_id: null,
        target_type: 'all'
      });
      setSelectedContactIds([]);
      
      setActiveTab('history');
      fetchData();
    } catch (error) {
      toast.error("Error al enviar");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'all' || c.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  if (isFetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-5 text-gray-900 dark:text-white"
      >
        <h1 className="text-2xl font-sans font-black mb-1 flex items-center gap-3">
          <div 
            className="p-2 rounded-xl backdrop-blur-md"
            style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
          >
            <FiSend className="w-5 h-5" />
          </div>
          Campañas de Difusión
        </h1>
        <p className="max-w-xl opacity-90 font-medium text-sm leading-relaxed text-gray-600 dark:text-white/80">
          Conecta con tus pacientes de forma masiva. Envía promociones, noticias o recomendaciones directo a su Email y App GynSys.
        </p>
      </div>

      {/* Tabs moved inside the content section */}

      <div className="max-w-4xl mx-auto">
        <div className={`p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Main Tabs Integrated */}
          <div className="flex bg-gray-100/80 dark:bg-gray-900/50 p-1.5 rounded-2xl w-fit mb-8 border border-gray-200/50 dark:border-gray-700">
            <button 
              onClick={() => setActiveTab('new')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white dark:bg-gray-700 shadow-md' : 'text-gray-500'}`}
              style={activeTab === 'new' ? { color: primaryColor } : {}}
            >
              <FiPlus /> Nueva Campaña
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 shadow-md' : 'text-gray-500'}`}
              style={activeTab === 'history' ? { color: primaryColor } : {}}
            >
              <FiClock /> Historial
            </button>
          </div>

          {activeTab === 'new' ? (
             <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                {/* 1. Recipient Selection */}
                <div className="space-y-4">
                  <h2 className="text-base font-sans font-black uppercase text-black dark:text-gray-400 tracking-wider flex items-center gap-2">
                    <span 
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
                    >
                      1
                    </span>
                    ¿A quién enviamos?
                    <span className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 border" style={{ borderColor: hexToRgba(primaryColor, 0.2), color: primaryColor }}>
                      <FiUsers className="w-3 h-3" />
                      {contacts.length} suscriptores totales
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'all', label: 'Todos', count: contacts.length },
                      { id: 'app_users', label: 'Usuarios App', count: contacts.filter(c => c.source === 'sync_cycle').length },
                      { id: 'patients', label: 'Pacientes', count: contacts.filter(c => c.source !== 'sync_cycle').length },
                      { id: 'selection', label: `Personalizar`, count: selectedContactIds.length }
                    ].map(t => (
                      <button 
                        key={t.id} type="button" onClick={() => setFormData({...formData, target_type: t.id})}
                        className={`p-3 rounded-xl border-2 text-[13px] font-black uppercase transition-all flex flex-col items-center gap-1 ${formData.target_type === t.id ? '' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                        style={formData.target_type === t.id ? { 
                          borderColor: primaryColor, 
                          backgroundColor: hexToRgba(primaryColor, 0.05),
                          color: primaryColor 
                        } : {}}
                      >
                        <span>{t.label}</span>
                        <span className="opacity-60 text-[10px]">({t.count})</span>
                      </button>
                    ))}
                  </div>

                  {formData.target_type === 'selection' && (
                    <div className="mt-6 space-y-6 animate-fade-in border-2 rounded-3xl p-6 bg-gray-50/50 dark:bg-gray-900/20" style={{ borderColor: hexToRgba(primaryColor, 0.2) }}>
                       {/* Sub-tabs for Personalization */}
                       <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                          <button 
                            type="button" 
                            onClick={() => setPersonalizeTab('add')}
                            className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${personalizeTab === 'add' ? '' : 'border-transparent text-gray-400'}`}
                            style={personalizeTab === 'add' ? { color: primaryColor, borderColor: primaryColor } : {}}
                          >
                            Añadir Manual
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setPersonalizeTab('list')}
                            className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all flex items-center gap-2 ${personalizeTab === 'list' ? '' : 'border-transparent text-gray-400'}`}
                            style={personalizeTab === 'list' ? { color: primaryColor, borderColor: primaryColor } : {}}
                          >
                            Lista de Envío 
                            <span className="px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-[8px]">{selectedContactIds.length}</span>
                          </button>
                       </div>

                       {personalizeTab === 'add' ? (
                         <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="space-y-1">
                                  <span className="text-[11px] font-black uppercase text-gray-600 px-1">Nombre Completo</span>
                                  <input 
                                    type="text" placeholder="Ej: Maria Lopez" value={newContact.full_name} 
                                    onChange={(e) => setNewContact({...newContact, full_name: e.target.value})} 
                                    className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-xs shadow-sm focus:ring-2 focus:ring-opacity-20" 
                                    style={{ '--tw-ring-color': primaryColor }}
                                  />
                               </div>
                               <div className="space-y-1">
                                  <span className="text-[11px] font-black uppercase text-gray-600 px-1">Email</span>
                                  <input 
                                    type="email" placeholder="maria@ejemplo.com" value={newContact.email} 
                                    onChange={(e) => setNewContact({...newContact, email: e.target.value})} 
                                    className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-xs shadow-sm focus:ring-2 focus:ring-opacity-20" 
                                    style={{ '--tw-ring-color': primaryColor }}
                                  />
                               </div>
                               <div className="space-y-1">
                                  <span className="text-[11px] font-black uppercase text-gray-600 px-1">Teléfono (opcional)</span>
                                  <input 
                                    type="text" placeholder="+54 9 11..." value={newContact.phone} 
                                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})} 
                                    className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-xs shadow-sm focus:ring-2 focus:ring-opacity-20" 
                                    style={{ '--tw-ring-color': primaryColor }}
                                  />
                               </div>
                            </div>
                            <div className="flex justify-end">
                               <button 
                                type="button"
                                onClick={handleAddContact}
                                disabled={isSubmittingContact}
                                className="px-8 py-3 rounded-xl text-white text-[10px] font-black shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -5px ${hexToRgba(primaryColor, 0.4)}` }}
                               >
                                {isSubmittingContact ? 'GUARDANDO...' : 'GUARDAR Y SELECCIONAR'}
                               </button>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-4 animate-fade-in">
                            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                               <table className="w-full text-left border-collapse text-xs">
                                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 shadow-sm">
                                     <tr>
                                        <th className="p-3 font-black text-gray-700 dark:text-gray-400 uppercase text-[9px]">Nombre</th>
                                        <th className="p-3 font-black text-gray-700 dark:text-gray-400 uppercase text-[9px] hidden md:table-cell">Email</th>
                                        <th className="p-3 font-black text-gray-700 dark:text-gray-400 uppercase text-[9px]">Origen</th>
                                        <th className="p-3 text-right"></th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {contacts.filter(c => selectedContactIds.includes(c.id)).map(c => (
                                       <tr key={c.id} className="border-t border-gray-50 dark:border-gray-700 transition-colors">
                                         <td className="p-3 font-bold">{c.full_name}</td>
                                         <td className="p-3 text-gray-700 dark:text-gray-400 hidden md:table-cell">{c.email}</td>
                                         <td className="p-3 uppercase text-[8px] font-black">{c.source}</td>
                                         <td className="p-3 text-right">
                                           <button 
                                              type="button" 
                                              onClick={() => setSelectedContactIds(prev => prev.filter(id => id !== c.id))} 
                                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                              title="Quitar de esta campaña"
                                            >
                                              <FiMinus />
                                            </button>
                                         </td>
                                       </tr>
                                     ))}
                                  </tbody>
                               </table>
                               {selectedContactIds.length === 0 && (
                                 <div className="p-8 text-center text-gray-400 italic">
                                   No hay destinatarios seleccionados. Usa "Añadir Manual" para agregar uno.
                                 </div>
                               )}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>

                {/* 2. Message Content */}
                <div className="space-y-4">
                   <h2 className="text-base font-sans font-black uppercase text-black dark:text-gray-400 tracking-wider flex items-center gap-2">
                    <span 
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
                    >
                      2
                    </span>
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
                            if (src) {
                              const baseUrl = `https://gynsys.net/p/${doctor?.slug_url || 'clinica'}`;
                              const fullUrl = src.url?.startsWith('http') ? src.url : `${baseUrl}${src.url}`;
                              
                              const htmlContent = `
                                <div style="font-family: sans-serif; line-height: 1.6; color: #374151;">
                                  <h2 style="color: ${primaryColor}; margin-bottom: 10px;">¡Hola! Tengo algo nuevo para ti.</h2>
                                  <p style="margin-bottom: 20px;">Te invito a revisar esta información que he preparado especialmente para mis pacientes: <strong>"${src.title}"</strong></p>
                                  ${src.summary ? `<p style="font-style: italic; color: #6b7280; border-left: 4px solid ${primaryColor}; padding-left: 15px; margin-bottom: 20px;">${src.summary}</p>` : ''}
                                  <div style="margin-top: 30px; text-align: center;">
                                    <a href="${fullUrl}" style="background-color: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                                      VER INFORMACIÓN COMPLETA
                                    </a>
                                  </div>
                                  <p style="margin-top: 40px; font-size: 12px; color: #9ca3af;">Enviado desde la plataforma digital de ${doctor?.nombre_completo || 'tu doctora'}.</p>
                                </div>
                              `;
                              
                              setFormData({
                                ...formData, 
                                source_type: type, 
                                source_id: src.id, 
                                title: `Difusión: ${src.title}`, 
                                subject: src.title, 
                                content_html: htmlContent.trim()
                              });
                            }
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
                      <input type="text" placeholder="Título interno de la campaña" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300 dark:border-gray-700 text-sm font-bold" />
                   </div>
                   
                   <input type="text" placeholder="Asunto (Visto por el paciente)" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full p-4 rounded-lg bg-gray-50 border-2 border-gray-300 dark:border-gray-700 text-sm font-bold" />
                   
                   <div className="flex flex-col gap-3">
                      <textarea 
                        rows={8} 
                        placeholder="Cuerpo del mensaje (acepta HTML)..." 
                        value={formData.content_html} 
                        onChange={(e) => setFormData({...formData, content_html: e.target.value})} 
                        className="w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-700 text-sm font-medium resize-none shadow-inner" 
                      />
                      
                      <div className="mt-2">
                          <ImageUpload 
                            label="¿Quieres adjuntar una imagen?" 
                            onImageChange={(file) => handleImageUpload(file)}
                            className="border-gray-100 dark:border-gray-700"
                          />
                          <p className="text-[10px] text-gray-500 mt-2 text-center font-medium">
                            La imagen se insertará automáticamente al final de tu mensaje. Puedes borrar el código HTML generado si te equivocas.
                          </p>
                      </div>
                    </div>
                </div>

                <button 
                  disabled={isLoading} 
                  className="w-full py-6 rounded-2xl text-white font-sans font-black flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-lg shadow-2xl group"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.8)})`,
                    boxShadow: `0 15px 30px -10px ${hexToRgba(primaryColor, 0.5)}`
                  }}
                >
                  {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><FiSend className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> LANZAR CAMPAÑA</>}
                </button>
             </form>
          ) : (
             /* History Section Integrated in same card style */
             <div className="space-y-4 animate-fade-in pb-4">
               {history.length === 0 ? (
                 <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed">
                   <FiMessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                   <p className="text-gray-400 text-sm italic">No se han registrado campañas</p>
                 </div>
               ) : (
                 history.map(item => (
                   <div 
                     key={item.id} 
                     className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent shadow-sm flex items-center justify-between gap-4 transition-all hover:border-gray-200 dark:hover:border-gray-700"
                   >
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{item.status === 'sent' ? <FiCheckCircle /> : <FiClock className="animate-spin" />}</div>
                        <div>
                           <h3 className="font-black text-xs uppercase tracking-tight">{item.title}</h3>
                           <div className="flex gap-2 items-center mt-1">
                             <span className="text-[9px] font-bold text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                             <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${item.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status === 'sent' ? 'Enviado' : 'Pendiente'}</span>
                             <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, 0.1) }}>{item.target_type}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 px-4 border-l">
                        <div className="text-center">
                           <div className="text-lg font-black" style={{ color: primaryColor }}>{item.stats?.sent_count || 0}</div>
                           <div className="text-[8px] font-black text-gray-700 dark:text-gray-400 uppercase">Destinatarios</div>
                        </div>
                        <FiChevronRight className="text-gray-300" />
                     </div>
                   </div>
                 ))
               )}
             </div>
          )}
        </div>
      </div>

    </div>
  );
}
