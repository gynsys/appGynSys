import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { FiUsers, FiSearch, FiPlus, FiPhone, FiMail, FiMapPin, FiCreditCard, FiEdit2, FiTrash2, FiSmartphone, FiUserCheck, FiUserPlus, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { campaignService } from '../../services/campaignService';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';

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

export default function DirectoryManager() {
  const { doctor, isDarkTheme, primaryColor } = useOutletContext() || {};
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [searchParams] = useSearchParams();
  
  const searchParam = searchParams.get('search');
  const replyPhone = searchParams.get('reply_phone');
  // const autoReply = searchParams.get('auto_reply');


  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // Delete status
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  
  // Forms
  const baseContactState = { full_name: '', email: '', phone: '', ci: '', city: '' };
  const [formData, setFormData] = useState(baseContactState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync Logic
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchContacts();
    
    // Auto-filter if search param is present
    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam));
    }
  }, [searchParam]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getContacts();
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      showToast('Error cargando el directorio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await campaignService.syncContacts();
      showToast(`¡Directorios sincronizados! (${res.added || 0} nuevos)`, 'success');
      fetchContacts();
    } catch (error) {
      showToast('Error sincronizando el servidor', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingContact(null);
    setFormData(baseContactState);
    setIsModalOpen(true);
  };

  const openEditModal = (contact) => {
    setIsEditMode(true);
    setEditingContact(contact);
    setFormData({
      full_name: contact.full_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      ci: contact.ci || '',
      city: contact.city || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      return showToast("El nombre completo y correo electrónico son obligatorios.", "error");
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && editingContact) {
        // Enviar solo los datos mutables al PATCH/UPDATE endpoint si existe (ver campaña)
        // Como estamos mapeando el mismo DTO, pasaremos el form completito
        const res = await campaignService.updateContact(editingContact.id, formData);
        setContacts(prev => prev.map(c => c.id === res.id ? res : c));
        showToast("Contacto actualizado", "success");
      } else {
        const res = await campaignService.createContact(formData);
        setContacts(prev => [res, ...prev]);
        showToast("Contacto añadido con éxito", "success");
      }
      setIsModalOpen(false);
    } catch (error) {
      showToast(error.response?.data?.detail || "Error al procesar el contacto", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    
    try {
      setIsSubmitting(true);
      await campaignService.deleteContact(contactToDelete.id);
      setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
      showToast("Contacto eliminado", "success");
      setIsDeleteModalOpen(false);
    } catch (error) {
       showToast("Error al eliminar", "error");
    } finally {
      setIsSubmitting(false);
      setContactToDelete(null);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ci?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Magic Reply Banner (Deep Link Response) */}
      {replyPhone && (
        <div className="mb-8 p-4 md:p-6 rounded-[24px] bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <FiPhone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Respuesta Rápida Detectada</h3>
                <p className="text-green-50 text-sm font-medium">¿Deseas responder a {searchTerm || 'este contacto'} ahora vía WhatsApp?</p>
              </div>
            </div>
            <a 
              href={`https://wa.me/${replyPhone}?text=Hola%20${encodeURIComponent(searchTerm || 'colega')}!%20He%20recibido%20tu%20solicitud%20de%20cita.%20Para%20agendar,%20por%20favor%20ingresa%20aquí:%20https://gynsys.net/${doctor?.slug_url}/onboarding`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-white text-green-600 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Responder Ahora <FiArrowRight />
            </a>
          </div>
        </div>
      )}

      <div className="mb-8 px-0 sm:px-0">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                 <div className="p-2 rounded-xl" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
                    <FiUsers className="w-5 h-5" />
                 </div>
                 Directorio Relacional
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Gestiona a tus pacientes, usuarios inscritos y afiliados VIP desde un solo panel de control unificado.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
               <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-sm shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-white"
               >
                  <FiSearch className={isSyncing ? "animate-spin" : ""} /> 
                  {isSyncing ? 'Buscando...' : 'Auto-Sincronizar'}
               </button>
               <button 
                  onClick={openAddModal}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: primaryColor }}
               >
                  <FiPlus /> Nuevo
               </button>
            </div>
         </div>

          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar contacto por nombre, cédula o email..."
              className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent md:text-sm text-gray-900 dark:text-white transition-all shadow-sm ${
                isFocused ? '' : 'border-gray-100 dark:border-gray-700'
              }`}
              style={{ 
                borderColor: isFocused ? (primaryColor || '#4f46e5') : undefined,
                boxShadow: isFocused ? `0 0 0 2px ${(primaryColor || '#4f46e5')}44` : undefined
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
      </div>

      {loading ? (
         <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-800" style={{ borderTopColor: primaryColor || '#4f46e5' }}></div>
         </div>
      ) : filteredContacts.length === 0 ? (
         <div className="bg-white dark:bg-gray-800 sm:rounded-[32px] border-y sm:border-x border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center text-gray-500 font-medium">
            No encontramos ningún contacto con esa información.
         </div>
       ) : (
        <>
          {/* VISTA MÓVIL (TARJETAS) - Visible solo en telas pequeñas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-0 sm:px-0 pb-12 md:hidden">
             {filteredContacts.map((contact) => (
                 <div key={contact.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative group">
                    
                    {/* Botones de Acción (Top Right) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                       <button
                          onClick={() => openEditModal(contact)}
                          className="p-1.5 rounded-lg bg-gray-50/80 dark:bg-gray-700/80 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-bold backdrop-blur-sm"
                          title="Editar"
                       >
                          <FiEdit2 className="w-4 h-4" />
                       </button>
                       <button
                          onClick={() => handleDeleteClick(contact)}
                          className="p-1.5 rounded-lg bg-gray-50/80 dark:bg-gray-700/80 text-gray-400 hover:text-red-500 transition-all font-bold backdrop-blur-sm"
                          title="Eliminar"
                       >
                          <FiTrash2 className="w-4 h-4" />
                       </button>
                    </div>

                   <div className="mb-3 pt-1">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5 break-words pr-16">{contact.full_name}</h2>
                      {contact.ci ? (
                         <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <FiCreditCard className="w-3" /> CI: {contact.ci}
                         </p>
                      ) : (
                         <p className="text-xs font-black text-gray-300 dark:text-gray-600 italic">Sin identificación</p>
                      )}
                   </div>

                   <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 overflow-hidden" 
                           title={contact.email}>
                         <FiMail className="w-4 h-4 mr-2 flex-shrink-0 opacity-50" />
                         <span className="truncate">{contact.email}</span>
                      </div>
                      {(contact.phone || contact.city) && (
                         <>
                            {contact.phone && (
                               <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                  <FiPhone className="w-4 h-4 mr-2 flex-shrink-0 opacity-50" />
                                  <span className="truncate">{contact.phone}</span>
                               </div>
                            )}
                            {contact.city && (
                               <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                  <FiMapPin className="w-4 h-4 mr-2 flex-shrink-0 opacity-50" />
                                  <span className="truncate text-xs opacity-80">{contact.city}</span>
                               </div>
                            )}
                         </>
                      )}
                   </div>

                 </div>
             ))}
          </div>

          {/* VISTA ESCRITORIO (TABLA) - Visible en PC */}
          <div className="hidden md:block overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm mb-12">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: hexToRgba(primaryColor, 0.5) }}>
                      <th className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Nombre Completo</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Identificación</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Contacto</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Ciudad</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest text-center">Acciones</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                   {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                         <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                               {contact.full_name}
                            </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                               {contact.ci ? (
                                  <><FiCreditCard className="opacity-50" /> {contact.ci}</>
                               ) : (
                                  <span className="text-gray-300 dark:text-gray-600 font-normal italic">N/A</span>
                               )}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                  <FiMail className="w-3.5 mr-2 opacity-50" /> {contact.email}
                               </div>
                               {contact.phone && (
                                  <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                     <FiPhone className="w-3.5 mr-2 opacity-50" /> {contact.phone}
                                  </div>
                               )}
                            </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                               {contact.city ? (
                                  <><FiMapPin className="opacity-50" /> {contact.city}</>
                               ) : (
                                  <span className="text-gray-300 dark:text-gray-600 font-normal italic">N/A</span>
                               )}
                            </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                               <button
                                  onClick={() => openEditModal(contact)}
                                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-bold"
                                  title="Editar Contacto"
                               >
                                  <FiEdit2 className="w-4 h-4" />
                               </button>
                               <button
                                  onClick={() => handleDeleteClick(contact)}
                                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 transition-all font-bold"
                                  title="Eliminar de Directorio"
                               >
                                  <FiTrash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </>
     )}

      {/* MODAL CREAR / EDITAR */}
      <Modal 
         isOpen={isModalOpen} 
         onClose={() => !isSubmitting && setIsModalOpen(false)}
         title={isEditMode ? "Actualizar Tarjeta de Contacto" : "Agregar Nuevo Contacto"}
      >
         <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
               <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Nombre Completo *</label>
               <input 
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium focus:outline-none transition-colors"
                  style={{ '--tw-ring-color': primaryColor }}
                  placeholder="Ej. Ana García"
               />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Cédula (CI)</label>
                  <input 
                     type="text"
                     value={formData.ci}
                     onChange={e => setFormData({...formData, ci: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium focus:outline-none transition-colors"
                     placeholder="V-25656..."
                  />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Correo *</label>
                  <input 
                     type="email"
                     required
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium focus:outline-none transition-colors"
                     placeholder="correo@ejemplo.com"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Teléfono Móvil</label>
                  <input 
                     type="text"
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium focus:outline-none transition-colors"
                     placeholder="+58 414..."
                  />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Ciudad o Dirección</label>
                  <input 
                     type="text"
                     value={formData.city}
                     onChange={e => setFormData({...formData, city: e.target.value})}
                     className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium focus:outline-none transition-colors"
                     placeholder="Caracas, DT"
                  />
               </div>
            </div>

            <div className="pt-4 flex w-full gap-3">
               <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
               >
                  Cancelar
               </button>
               <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl text-white font-bold shadow-md hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: primaryColor }}
               >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Datos'}
               </button>
            </div>
          </form>
      </Modal>

      {/* DISPATCH CONFIRMAR ELIMINAR (ALERT) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        size="alert"
      >
        <div className="flex flex-col items-center text-center pt-[5px] pb-2">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                <FiAlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">¿Eliminar contacto?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-5 leading-relaxed">
                Estás a punto de eliminar a <span className="text-gray-900 dark:text-white font-black underline">{contactToDelete?.full_name}</span> permanentemente. Esta acción no se puede deshacer.
            </p>
            
            <div className="grid grid-cols-2 gap-3 w-full">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isSubmitting}
                    className="py-3 px-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={confirmDelete}
                    disabled={isSubmitting}
                    className="py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
