
import React from 'react';
import { FiCpu, FiInstagram, FiImage, FiZap, FiFolder, FiChevronDown } from 'react-icons/fi';

export const ArticleSelector = ({
  posts,
  selectedPost,
  setSelectedPost,
  setGeneratedContent,
  showProjects,
  setShowProjects,
  handleGenerate,
  handleTestDesign,
  generating
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Article Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">1. Crear Nuevo desde Artículo</h2>
          <select
            value={selectedPost?.id || ''}
            onChange={(e) => {
              setSelectedPost(posts.find(p => p.id === parseInt(e.target.value)));
              setGeneratedContent(null);
            }}
            className="block w-full rounded-xl border-gray-200 dark:bg-gray-900 dark:text-white p-3 border font-manrope focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
          >
            <option value="" disabled>Elegir artículo...</option>
            {posts.map(post => <option key={post.id} value={post.id}>{post.title}</option>)}
          </select>
        </div>

        {/* Step 2: Saved Projects Access */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">2. Continuar Proyecto Guardado</h2>
          <div className="relative">
            <button 
              onClick={() => setShowProjects(!showProjects)}
              className="flex items-center justify-between w-full px-5 py-3 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl border border-indigo-100 dark:border-indigo-700 transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <FiFolder className="text-indigo-500" />
                <span className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight">Mis Proyectos Guardados</span>
              </div>
              <FiChevronDown className={`text-indigo-400 transition-transform ${showProjects ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Generation Options */}
      {selectedPost && !generating && (
        <div className="bg-indigo-600 rounded-[32px] p-1 flex flex-col md:flex-row shadow-xl shadow-indigo-100 dark:shadow-none animate-fadeIn">
          <button 
            onClick={() => handleGenerate('reel')}
            className="flex-1 flex items-center justify-center gap-3 py-6 px-8 text-white hover:bg-white/10 rounded-[30px] transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiInstagram size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Generar Video</p>
              <p className="text-lg font-black uppercase tracking-tight">GynSys Reel IA</p>
            </div>
          </button>
          
          <div className="w-px bg-white/10 hidden md:block"></div>
          
          <button 
            onClick={() => handleGenerate('carousel')}
            className="flex-1 flex items-center justify-center gap-3 py-6 px-8 text-white hover:bg-white/10 rounded-[30px] transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiImage size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Generar Diseño</p>
              <p className="text-lg font-black uppercase tracking-tight">Carrusel Médico</p>
            </div>
          </button>

          <div className="w-px bg-white/10 hidden md:block"></div>

          <button 
            onClick={handleTestDesign}
            className="flex-1 flex items-center justify-center gap-3 py-6 px-8 text-indigo-100 hover:bg-white/10 rounded-[30px] transition-all group"
          >
            <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform text-amber-400">
              <FiZap size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Diseño Libre</p>
              <p className="text-lg font-black uppercase tracking-tight">Modo Boceto</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
