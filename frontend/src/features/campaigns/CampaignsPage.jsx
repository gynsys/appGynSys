import React, { useState, useEffect } from 'react';
import { 
  FiSend, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, 
  FiFileText, FiLayers, FiMessageSquare, FiMail, FiBell, 
  FiChevronRight, FiCheck, FiUsers, FiSearch, FiTrash2, 
  FiUserPlus, FiRefreshCw, FiMinus, FiSmartphone, FiUser, 
  FiList, FiPlusCircle, FiEdit2 
} from 'react-icons/fi';
import { campaignService } from '../../services/campaignService';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { ImageUpload } from '../../components/common/ImageUpload';
import { getImageUrl } from '../../lib/imageUtils';

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
  
  // New States for Edit/Delete
  const [editingContact, setEditingContact] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content_html: '',
    source_type: 'custom',
    source_id: null,
    target_type: 'all'
  });

  const [selectedCampaignImage, setSelectedCampaignImage] = useState(null);
  const [selectedSourceMeta, setSelectedSourceMeta] = useState(null);

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
    if (!file) {
        setSelectedCampaignImage(null);
        return;
    }
    try {
      const response = await campaignService.uploadCampaignImage(file);
      const imageUrl = response.image_url;
      // getImageUrl already handles prepending the server root in production
      const fullImageUrl = getImageUrl(imageUrl);
      setSelectedCampaignImage(fullImageUrl);
      toast.success("Imagen adjuntada correctamente");
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

  const handleAddContact = async () => {
    if (!newContact.full_name || !newContact.email) {
      toast.error("Nombre y Email son obligatorios");
      return;
    }
    setIsSubmittingContact(true);
    try {
      const res = await campaignService.createContact(newContact);
      setContacts(prev => {
        const exists = prev.find(c => c.id === res.id);
        if (exists) return prev;
        return [res, ...prev];
      });
      setSelectedContactIds(prev => prev.includes(res.id) ? prev : [...prev, res.id]);
      setNewContact({ full_name: '', email: '', phone: '', source: 'manual' });
      setFormData(prev => ({ ...prev, target_type: 'all' }));
      toast.success("Contacto listo y seleccionado");
    } catch (error) {
      const msg = error.response?.data?.detail || "Error al añadir contacto";
      toast.error(msg);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact.full_name || !editingContact.email) {
      toast.error("Nombre y Email son obligatorios");
      return;
    }
    try {
      const res = await campaignService.updateContact(editingContact.id, {
        full_name: editingContact.full_name,
        email: editingContact.email,
        phone: editingContact.phone
      });
      setContacts(prev => prev.map(c => c.id === res.id ? res : c));
      setIsEditModalOpen(false);
      setEditingContact(null);
      toast.success("Contacto actualizado");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar");
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este contacto?")) return;
    try {
      await campaignService.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
      setSelectedContactIds(prev => prev.filter(cid => cid !== id));
      toast.success("Contacto eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.content_html) return toast.warning("Completa todos los campos");
    if (formData.target_type === 'selection' && selectedContactIds.length === 0) return toast.warning("Selecciona al menos un destinatario");

    setIsLoading(true);
    
    // Decisión inteligente de destinatarios
    let finalTargetType = formData.target_type;
    let finalSelection = selectedContactIds;

    // Si hay selección individual, mandamos esa, sin importar la pestaña
    if (selectedContactIds.length > 0) {
      finalTargetType = 'selection';
    }

    // ENSAMBLADO FINAL: Unir Mensaje + Fuente + Imagen
    let finalContent = formData.content_html;

    // 1. Añadir Tarjeta de Fuente (Blog/Recomendación) si existe
    if (selectedSourceMeta) {
      const cardHtml = `
        <div style="margin-top: 30px; padding: 25px; border-radius: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; font-family: sans-serif;">
          <h2 style="color: ${primaryColor}; margin-top: 0; font-size: 18px;">${selectedSourceMeta.title}</h2>
          ${selectedSourceMeta.summary ? `<p style="font-style: italic; color: #6b7280; border-left: 4px solid ${primaryColor}; padding-left: 15px; margin-bottom: 20px;">${selectedSourceMeta.summary}</p>` : ''}
          <div style="text-align: center; margin-top: 25px;">
            <a href="${selectedSourceMeta.url}" style="background-color: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">
              VER INFORMACIÓN COMPLETA
            </a>
          </div>
          <p style="margin-top: 30px; font-size: 11px; color: #9ca3af; text-align: center;">Enviado desde la plataforma digital de ${doctor?.nombre_completo || 'tu doctora'}.</p>
        </div>
      `;
      finalContent += cardHtml;
    }

    // 2. Añadir Imagen al final si existe
    if (selectedCampaignImage) {
        finalContent += `\n<div style="text-align: center; margin: 20px 0;"><img src="${selectedCampaignImage}" style="max-width: 100%; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);" alt="Imagen de campaña" /></div>\n`;
    }

    try {
      await campaignService.createCampaign({
        ...formData,
        content_html: finalContent,
        target_type: finalTargetType,
        selected_contact_ids: finalTargetType === 'selection' ? finalSelection : null
      });
      toast.success("Campaña en cola");
      
      setFormData({
        title: '',
        subject: '',
        content_html: '',
        source_type: 'custom',
        source_id: null,
        target_type: 'all'
      });
      setSelectedContactIds([]);
      setSelectedCampaignImage(null);
      setSelectedSourceMeta(null);
      
      setActiveTab('history');
      fetchData();
    } catch (error) {
      toast.error("Error al enviar");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="relative overflow-hidden rounded-2xl p-5 text-gray-900 dark:text-white">
        <h1 className="text-2xl font-sans font-black mb-1 flex items-center gap-3">
          <div className="p-2 rounded-xl backdrop-blur-md" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
            <FiSend className="w-5 h-5" />
          </div>
          Campañas de Difusión
        </h1>
        <p className="max-w-xl opacity-90 font-medium text-sm leading-relaxed text-gray-600 dark:text-white/80">
          Conecta con tus pacientes de forma masiva. Envía promociones, noticias o recomendaciones directo a su Email y App GynSys.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className={`p-4 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
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
                <div className="space-y-4">
                  <h2 className="text-base font-sans font-black uppercase text-black dark:text-gray-400 tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>1</span>
                    ¿A quién enviamos?
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { id: 'all', label: 'Todos', count: contacts.length, icon: <FiUsers /> },
                      { id: 'app_users', label: 'Usuarios App', count: contacts.filter(c => c.source === 'sync_cycle').length, icon: <FiSmartphone /> },
                      { id: 'patients', label: 'Pacientes', count: contacts.filter(c => c.source !== 'sync_cycle').length, icon: <FiUser /> },
                      { id: 'add_manual', label: `Nuevo`, count: null, icon: <FiPlus /> }
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
                        <span className="text-base mb-1">{t.icon}</span>
                        <span>{t.label}</span>
                        {t.count !== null && <span className="opacity-60 text-[10px]">({t.count})</span>}
                      </button>
                    ))}
                  </div>

                  {formData.target_type === 'add_manual' ? (
                    <div className="mt-6 space-y-6 animate-fade-in border-2 rounded-3xl p-8 bg-gray-50/50 dark:bg-gray-900/20" style={{ borderColor: hexToRgba(primaryColor, 0.2) }}>
                       <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                          <FiPlusCircle style={{ color: primaryColor }} /> Añadir nuevo suscriptor manualmente
                       </h3>
                       <div className="space-y-4">
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
                          <div className="flex justify-end pt-2">
                             <button 
                              type="button"
                              onClick={handleAddContact}
                              disabled={isSubmittingContact}
                              className="px-10 py-3 rounded-xl text-white text-[10px] font-black shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -5px ${hexToRgba(primaryColor, 0.4)}` }}
                             >
                              {isSubmittingContact ? 'GUARDANDO...' : 'GUARDAR Y SELECCIONAR'}
                             </button>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between px-2">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                              Suscriptores en esta categoría
                           </h3>
                           {selectedContactIds.length > 0 && (
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-blue-600 uppercase">
                                  {selectedContactIds.length} Seleccionados
                                </span>
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedContactIds([])}
                                  className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                                >
                                    Limpiar lista
                                </button>
                              </div>
                           )}
                        </div>
                        
                        <div className="md:max-h-[350px] md:overflow-y-auto overflow-x-auto rounded-3xl md:border border-gray-100 dark:border-gray-700 md:bg-white dark:bg-gray-800 md:shadow-sm transition-all md:overflow-hidden">
                           {/* VISTA DESKTOP: TABLA */}
                           <table className="w-full text-left border-collapse text-xs hidden md:table">
                              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 shadow-sm border-b">
                                 <tr>
                                    <th className="p-4 w-10">
                                       <input 
                                         type="checkbox" checked={selectedContactIds.length > 0 && contacts.filter(c => {
                                           if (formData.target_type === 'all') return true;
                                           if (formData.target_type === 'app_users') return c.source === 'sync_cycle';
                                           if (formData.target_type === 'patients') return c.source !== 'sync_cycle';
                                           return true;
                                         }).every(c => selectedContactIds.includes(c.id))}
                                         onChange={(e) => {
                                           const visible = contacts.filter(c => {
                                             if (formData.target_type === 'all') return true;
                                             if (formData.target_type === 'app_users') return c.source === 'sync_cycle';
                                             if (formData.target_type === 'patients') return c.source !== 'sync_cycle';
                                             return true;
                                           });
                                           if (e.target.checked) setSelectedContactIds(prev => [...new Set([...prev, ...visible.map(c => c.id)])]);
                                           else {
                                             const visibleIds = visible.map(c => c.id);
                                             setSelectedContactIds(prev => prev.filter(id => !visibleIds.includes(id)));
                                           }
                                         }}
                                         className="rounded cursor-pointer"
                                       />
                                    </th>
                                    <th className="p-4 font-black text-gray-700 dark:text-gray-400 uppercase text-[9px]">Nombre</th>
                                    <th className="p-4 font-black text-gray-700 dark:text-gray-400 uppercase text-[9px] hidden md:table-cell">Email</th>
                                    <th className="p-4 font-black text-gray-700 dark:text-gray-400 uppercase text-[9px]">Origen</th>
                                    <th className="p-4 text-right font-black text-gray-700 dark:text-gray-400 uppercase text-[9px]">Acciones</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {contacts
                                   .filter(c => {
                                     if (formData.target_type === 'app_users') return c.source === 'sync_cycle';
                                     if (formData.target_type === 'patients') return c.source !== 'sync_cycle';
                                     return true; // 'all'
                                   })
                                   .map(c => (
                                   <tr key={c.id} className="group border-t border-gray-50 dark:border-gray-700 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                     <td className="p-4">
                                        <input 
                                           type="checkbox" 
                                           checked={selectedContactIds.includes(c.id)}
                                           onChange={(e) => {
                                              if (e.target.checked) setSelectedContactIds(prev => [...prev, c.id]);
                                              else setSelectedContactIds(prev => prev.filter(id => id !== c.id));
                                           }}
                                           className="rounded cursor-pointer border-gray-300 dark:border-gray-600"
                                           style={selectedContactIds.includes(c.id) ? { accentColor: primaryColor } : {}}
                                        />
                                     </td>
                                     <td className="p-4">
                                        <div className="font-bold">{c.full_name}</div>
                                        <div className="md:hidden text-[10px] text-gray-500">{c.email}</div>
                                     </td>
                                     <td className="p-4 text-gray-700 dark:text-gray-400 hidden md:table-cell font-medium">{c.email}</td>
                                     <td className="p-4">
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[8px] font-black uppercase text-gray-500">
                                           {c.source === 'sync_cycle' ? 'App' : c.source === 'sync_patient' ? 'Paciente' : 'Manual'}
                                        </span>
                                     </td>
                                     <td className="p-4 text-right">
                                      <div className="flex items-center justify-end gap-2 transition-opacity">
                                         <button 
                                           type="button" 
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingContact(c);
                                              setIsEditModalOpen(true);
                                           }}
                                           className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-blue-500 transition-all"
                                         >
                                           <FiEdit2 className="w-3.5 h-3.5" />
                                         </button>
                                         <button 
                                           type="button" 
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteContact(c.id);
                                           }} 
                                           className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all"
                                         >
                                           <FiTrash2 className="w-3.5 h-3.5" />
                                         </button>
                                      </div>
                                    </td>
                                   </tr>
                                 ))}
                              </tbody>
                           </table>

                           {/* VISTA MOBILE: LISTA DE TARJETAS (CAPILLARY/NATIVA) */}
                           <div className="md:hidden space-y-3 pb-8">
                             {contacts
                                .filter(c => {
                                  if (formData.target_type === 'app_users') return c.source === 'sync_cycle';
                                  if (formData.target_type === 'patients') return c.source !== 'sync_cycle';
                                  return true;
                                })
                                .map(c => (
                                  <div 
                                    key={c.id} 
                                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${selectedContactIds.includes(c.id) ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
                                  >
                                    <div className="flex items-center flex-1 gap-4 overflow-hidden">
                                       <input 
                                          type="checkbox" 
                                          checked={selectedContactIds.includes(c.id)}
                                          onChange={(e) => {
                                             if (e.target.checked) setSelectedContactIds(prev => [...prev, c.id]);
                                             else setSelectedContactIds(prev => prev.filter(id => id !== c.id));
                                          }}
                                          className="w-5 h-5 rounded-lg cursor-pointer shrink-0"
                                          style={selectedContactIds.includes(c.id) ? { accentColor: primaryColor } : {}}
                                       />
                                       <div className="flex-1 overflow-hidden">
                                          <div className="font-bold text-[13px] truncate dark:text-white">{c.full_name}</div>
                                          <div className="text-[10px] text-gray-500 truncate dark:text-gray-400">{c.email}</div>
                                          <div className="mt-1 flex items-center gap-2">
                                             <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[8px] font-black uppercase text-gray-500 dark:text-gray-400">
                                                {c.source === 'sync_cycle' ? 'App' : c.source === 'sync_patient' ? 'Paciente' : 'Manual'}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 shrink-0 border-l pl-3 dark:border-gray-700">
                                       <button 
                                         type="button" 
                                         onClick={() => {
                                            setEditingContact(c);
                                            setIsEditModalOpen(true);
                                         }}
                                         className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-blue-500 shadow-sm"
                                       >
                                         <FiEdit2 className="w-5 h-5" />
                                       </button>
                                       <button 
                                         type="button" 
                                         onClick={() => handleDeleteContact(c.id)} 
                                         className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-red-500 shadow-sm"
                                       >
                                         <FiTrash2 className="w-5 h-5" />
                                       </button>
                                    </div>
                                  </div>
                                ))}
                           </div>
                        </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                   <h2 className="text-base font-sans font-black uppercase text-black dark:text-gray-400 tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>2</span>
                    ¿Qué quieres contar?
                  </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select 
                        value={formData.source_id ? `${formData.source_type}:${formData.source_id}` : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setFormData({...formData, source_type: 'custom', source_id: null, title: '', subject: '', content_html: ''});
                            setSelectedSourceMeta(null);
                          } else {
                            const [type, id] = e.target.value.split(':');
                            const src = sources.find(s => s.id === parseInt(id) && s.type === type);
                            if (src) {
                              const baseUrl = `https://gynsys.net/p/${doctor?.slug_url || 'clinica'}`;
                              const fullUrl = src.url?.startsWith('http') ? src.url : `${baseUrl}${src.url}`;
                              
                              setSelectedSourceMeta({
                                title: src.title,
                                summary: src.summary,
                                url: fullUrl
                              });

                              setFormData({
                                ...formData, 
                                source_type: type, 
                                source_id: src.id, 
                                title: `Difusión: ${src.title}`, 
                                subject: src.title, 
                                content_html: `¡Hola! Te comparto esta información importante para tu bienestar: "${src.title}". Espero que te sea de gran utilidad.\n\nSaludos.`
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
                      <input type="text" placeholder="Título interno de la campaña" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300 dark:border-gray-700 text-sm font-bold shadow-sm" />
                   </div>

                   {selectedSourceMeta && (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 animate-in slide-in-from-left duration-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-500 text-white">
                            <FiFileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-blue-400">Contenido Adjunto</p>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{selectedSourceMeta.title}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedSourceMeta(null);
                            setFormData({...formData, source_type: 'custom', source_id: null});
                          }}
                          className="p-2 text-blue-400 hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                   )}
                   
                   <input type="text" placeholder="Asunto (Visto por el paciente)" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full p-4 rounded-lg bg-gray-50 border-2 border-gray-300 dark:border-gray-700 text-sm font-bold shadow-sm" />
                   
                   <div className="flex flex-col gap-3">
                      <textarea 
                        rows={8} 
                        placeholder="Cuerpo del mensaje (acepta HTML)..." 
                        value={formData.content_html} 
                        onChange={(e) => setFormData({...formData, content_html: e.target.value})} 
                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-700 text-sm font-medium resize-none shadow-inner" 
                      />
                      
                      <div className="mt-2 text-gray-900 dark:text-white">
                          <ImageUpload 
                            label="¿Quieres adjuntar una imagen?" 
                            currentImage={selectedCampaignImage}
                            onImageChange={(file) => handleImageUpload(file)}
                            className="border-gray-100 dark:border-gray-700 shadow-sm"
                          />
                          <p className="text-[10px] text-gray-500 mt-2 text-center font-medium">
                            La imagen se insertará automáticamente al final de tu mensaje.
                          </p>
                      </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                  {selectedContactIds.length > 0 && formData.target_type !== 'selection' && (
                     <div className="px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 flex items-center gap-3 animate-pulse">
                        <FiAlertCircle className="text-amber-500 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                           Tienes {selectedContactIds.length} seleccionados. El envío se limitará a ellos.
                        </p>
                     </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 rounded-2xl text-white font-sans font-black flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-sm shadow-2xl group"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.8)})`,
                      boxShadow: `0 20px 40px -10px ${hexToRgba(primaryColor, 0.4)}`
                    }}
                  >
                    <FiSend className={`w-5 h-5 ${isLoading ? 'animate-ping' : 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform'}`} />
                    {isLoading ? 'PROCESANDO...' : (
                       selectedContactIds.length > 0 
                       ? `LANZAR A LOS ${selectedContactIds.length} SELECCIONADOS` 
                       : `LANZAR A TODO "${formData.target_type === 'all' ? 'TODOS' : formData.target_type.toUpperCase()}"`
                    )}
                  </button>
               </div>
             </form>
          ) : (
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
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{item.status === 'sent' ? <FiCheckCircle /> : <FiClock className={item.status === 'sending' ? 'animate-spin' : ''} />}</div>
                        <div>
                           <h3 className="font-black text-xs uppercase tracking-tight">{item.title}</h3>
                           <div className="flex gap-2 items-center mt-1">
                             <span className="text-[9px] font-bold text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                             <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${item.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status === 'sent' ? 'Enviado' : 'Procesando'}</span>
                             <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, 0.1) }}>{item.target_type}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 px-4 border-l">
                        <div className="text-center">
                           <div className="text-lg font-black" style={{ color: primaryColor }}>{item.stats?.sent_count || 0}</div>
                           <div className="text-[8px] font-black text-gray-700 dark:text-gray-400 uppercase">Enviados</div>
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

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
           <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: primaryColor }}></div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-2 flex items-center gap-2">
                 <FiEdit2 style={{ color: primaryColor }} /> Editar Suscriptor
              </h2>
              <div className="space-y-6">
                 <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-gray-400 px-1">Nombre Completo</span>
                    <input 
                      type="text" value={editingContact.full_name} 
                      onChange={(e) => setEditingContact({...editingContact, full_name: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-bold text-sm" 
                    />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-gray-400 px-1">Email</span>
                    <input 
                      type="email" value={editingContact.email} 
                      onChange={(e) => setEditingContact({...editingContact, email: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-bold text-sm" 
                    />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-gray-400 px-1">Teléfono</span>
                    <input 
                      type="text" value={editingContact.phone || ''} 
                      onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})} 
                      className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-bold text-sm" 
                    />
                 </div>
              </div>
              <div className="flex gap-3 mt-10">
                 <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase text-gray-400 bg-gray-100 dark:bg-gray-700 transition-all hover:bg-gray-200">Cancelar</button>
                 <button onClick={handleUpdateContact} className="flex-[2] py-4 rounded-2xl font-black text-xs uppercase text-white shadow-lg transition-all" style={{ backgroundColor: primaryColor }}>Guardar Cambios</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
