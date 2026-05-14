
import React from 'react';
import { FiTrash2, FiVideo, FiImage, FiCpu, FiLoader, FiCheck, FiX } from 'react-icons/fi';

export const ProjectGrid = ({ 
  projects, 
  onLoad, 
  onDelete, 
  variant = 'full', 
  activeProjectId,
  loading = false
}) => {
  const [isDeleting, setIsDeleting] = React.useState(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(null);

  const handleDeleteConfirmed = async (p) => {
    setConfirmingDelete(null);
    setIsDeleting(p.id);
    try {
      await onDelete(p.id, p.is_backend);
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-12 flex items-center justify-center gap-2 text-gray-400 ${variant === 'compact' ? 'px-6' : ''}`}>
        <FiLoader className="animate-spin" size={14} />
        <span className="italic text-sm">Cargando proyectos...</span>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-400 italic ${variant === 'compact' ? 'px-6' : ''}`}>
        No tienes proyectos guardados todavía.
      </div>
    );
  }

  /* ─────────────── COMPACT VARIANT (dropdown) ─────────────── */
  if (variant === 'compact') {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] max-h-[400px] overflow-y-auto no-scrollbar animate-slideDown">
        <div className="p-2 space-y-1">
          {projects.map(p => (
            <div
              key={p.id}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${activeProjectId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              {/* Project info */}
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onLoad(p)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeProjectId === p.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 group-hover:text-indigo-500'}`}>
                   {p.content?.video_slides ? <FiVideo size={18} /> : <FiImage size={18} />}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-black uppercase tracking-tight ${activeProjectId === p.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>{p.name}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Reciente'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${p.is_backend ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                  {p.is_backend ? 'Nube' : 'Local'}
                </span>

                {/* Inline confirm delete */}
                {confirmingDelete === p.id ? (
                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 rounded-lg px-2 py-1 animate-fadeIn">
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-tight mr-1">¿Eliminar?</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConfirmed(p); }}
                      className="p-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all"
                      title="Confirmar"
                    >
                      <FiCheck size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmingDelete(null); }}
                      className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-all"
                      title="Cancelar"
                    >
                      <FiX size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={isDeleting === p.id}
                    onClick={(e) => { e.stopPropagation(); setConfirmingDelete(p.id); }}
                    className={`p-2 rounded-lg transition-all ${isDeleting === p.id ? 'opacity-50' : 'hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500'}`}
                    title="Eliminar proyecto"
                  >
                    {isDeleting === p.id ? <FiCpu className="animate-spin" size={14} /> : <FiTrash2 size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─────────────── FULL VARIANT (grid cards) ─────────────── */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map(p => (
        <div 
          key={p.id} 
          className={`bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 group relative ${activeProjectId === p.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-100 dark:border-gray-700'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeProjectId === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
               {p.content?.video_slides ? <FiVideo size={24} /> : <FiImage size={24} />}
            </div>
            <div className="flex gap-2">
              <span className={`text-[8px] px-2 py-1 rounded-lg uppercase font-black tracking-widest ${p.is_backend ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                {p.is_backend ? 'Nube' : 'Local'}
              </span>
              {p.content?.video_slides && (
                <span className="text-[8px] px-2 py-1 rounded-lg uppercase font-black tracking-widest bg-purple-100 text-purple-600">
                  Video
                </span>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1 truncate">{p.name}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Fecha no disponible'}
            </p>
          </div>

          {/* Inline confirm delete overlay (full variant) */}
          {confirmingDelete === p.id ? (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-xs font-black text-red-600 uppercase tracking-tight flex-1">¿Eliminar permanentemente?</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConfirmed(p); }}
                className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all"
              >
                <FiCheck size={12} /> Sí
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmingDelete(null); }}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                <FiX size={12} /> No
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => onLoad(p)}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"
              >
                Abrir Proyecto
              </button>
              <button 
                disabled={isDeleting === p.id}
                onClick={(e) => { e.stopPropagation(); setConfirmingDelete(p.id); }}
                className={`w-12 flex items-center justify-center rounded-xl transition-all ${isDeleting === p.id ? 'opacity-50 bg-gray-100' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}
              >
                {isDeleting === p.id ? <FiCpu className="animate-spin" size={16} /> : <FiTrash2 size={16} />}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
