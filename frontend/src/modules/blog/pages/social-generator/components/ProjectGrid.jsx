
import React from 'react';
import { FiFolder, FiTrash2, FiVideo, FiImage, FiCpu } from 'react-icons/fi';

export const ProjectGrid = ({ 
  projects, 
  onLoad, 
  onDelete, 
  variant = 'full', 
  activeProjectId 
}) => {
  if (!projects || projects.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-400 italic ${variant === 'compact' ? 'px-6' : ''}`}>
        No tienes proyectos guardados todavía.
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] max-h-[400px] overflow-y-auto no-scrollbar animate-slideDown">
        <div className="p-2 space-y-1">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => onLoad(p)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${activeProjectId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeProjectId === p.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-400 group-hover:text-indigo-500'}`}>
                   {p.content?.video_slides ? <FiVideo size={18} /> : <FiImage size={18} />}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-black uppercase tracking-tight ${activeProjectId === p.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>{p.name}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Reciente'}
                  </p>
                </div>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${p.is_backend ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                {p.is_backend ? 'Nube' : 'Local'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

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

          <div className="flex gap-2">
            <button 
              onClick={() => onLoad(p)}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"
            >
              Abrir Proyecto
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('¿Eliminar este proyecto permanentemente?')) {
                  onDelete(p.id, p.is_backend);
                }
              }}
              className="w-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
