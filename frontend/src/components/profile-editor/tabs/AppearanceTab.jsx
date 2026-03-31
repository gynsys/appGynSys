import React from 'react'
import Input from '../../common/Input'

const DESIGN_TEMPLATES = [
    { id: 'glass', label: 'Glass Premium', description: 'Moderno, translúcido y elegante (Default).' },
    { id: 'minimal', label: 'Clínico Minimal', description: 'Limpio, sobrio y profesional. Ideal para marcas serias.' },
    { id: 'soft', label: 'Soft & Care', description: 'Amable, colores pastel y formas suaves. Ideal para pediatría/maternidad.' },
    { id: 'dark', label: 'Executive Dark', description: 'Modo nocturno, alto contraste y lujo. Ideal para marcas premium.' }
]

const AppearanceTab = ({
    formData,
    handleChange
}) => {
    // Helper for transparency
    const hexToRgba = (hex, alpha) => {
        try {
            if (!hex || hex === 'transparent') return 'transparent';
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } catch (e) {
            return hex;
        }
    };

    const primaryColor = formData.theme_primary_color || '#4F46E5';

    return (
        <div className="space-y-8 animate-fadeIn font-manrope">
            {/* Theme Selector - Visual Cards */}
            <div>
                <h2 className="text-xl font-playfair font-semibold text-black mb-4 dark:text-white">Plantilla de Diseño (Tema)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DESIGN_TEMPLATES.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => handleChange({ target: { name: 'design_template', value: template.id } })}
                            className={`
                cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 relative
                ${(formData.design_template || 'glass') === template.id
                                    ? 'border-transparent shadow-lg transform scale-[1.02]'
                                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
                                }
              `}
                            style={(formData.design_template || 'glass') === template.id ? { 
                                backgroundColor: hexToRgba(primaryColor, 0.05),
                                borderColor: primaryColor,
                                boxShadow: `0 10px 15px -3px ${hexToRgba(primaryColor, 0.2)}`
                            } : {}}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold text-sm tracking-tight ${(formData.design_template || 'glass') === template.id
                                    ? 'text-black dark:text-white'
                                    : 'text-gray-900 dark:text-white'
                                    }`}
                                    style={(formData.design_template || 'glass') === template.id ? { color: primaryColor } : {}}
                                >
                                    {template.label}
                                </span>
                                {(formData.design_template || 'glass') === template.id && (
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{template.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 my-8"></div>

            {/* Colors Section */}
            <div>
                <h2 className="text-xl font-playfair font-semibold text-black mb-4 dark:text-white">Personalización de Colores</h2>
                <div className="bg-gray-50/50 dark:bg-gray-800/30 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-8">
                    <div>
                        <label htmlFor="theme_primary_color" className="block text-xs font-black uppercase tracking-widest text-black/60 mb-3 dark:text-gray-300">
                            Color Primario (Marca)
                        </label>
                        <div className="flex items-center gap-6">
                            <input
                                name="theme_primary_color"
                                id="theme_primary_color"
                                type="color"
                                value={formData.theme_primary_color}
                                onChange={handleChange}
                                className="h-14 w-24 p-1.5 bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 cursor-pointer rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                style={{ borderColor: hexToRgba(primaryColor, 0.2) }}
                            />
                            <div className="space-y-1">
                                <span className="block text-lg font-black font-mono tracking-tighter" style={{ color: primaryColor }}>{formData.theme_primary_color}</span>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase">Código Hexadecimal</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-medium text-gray-400 mt-3 italic">Este color se aplicará dinámicamente en botones, iconos y elementos clave de tu marca.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div>
                            <label htmlFor="theme_body_bg_color" className="block text-[10px] font-black uppercase tracking-widest text-black/60 mb-3 dark:text-gray-300">
                                Fondo General de Página
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    name="theme_body_bg_color"
                                    id="theme_body_bg_color"
                                    type="color"
                                    value={formData.theme_body_bg_color || '#ffffff'}
                                    onChange={handleChange}
                                    className="h-10 w-20 p-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-pointer rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'theme_body_bg_color', value: '' } })}
                                    className="text-[10px] font-black uppercase tracking-wider underline opacity-50 hover:opacity-100 transition-opacity"
                                    style={{ color: primaryColor }}
                                >
                                    Restaurar
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="theme_container_bg_color" className="block text-[10px] font-black uppercase tracking-widest text-black/60 mb-3 dark:text-gray-300">
                                Fondo de Tarjetas
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    name="theme_container_bg_color"
                                    id="theme_container_bg_color"
                                    type="color"
                                    value={formData.theme_container_bg_color || '#ffffff'}
                                    onChange={handleChange}
                                    className="h-10 w-20 p-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-pointer rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'theme_container_bg_color', value: '' } })}
                                    className="text-[10px] font-black uppercase tracking-wider underline opacity-50 hover:opacity-100 transition-opacity"
                                    style={{ color: primaryColor }}
                                >
                                    Restaurar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 my-8"></div>

            {/* Shadows Control */}
            <div>
                <h2 className="text-xl font-playfair font-semibold text-black mb-6 dark:text-white">Efectos Visuales</h2>
                <div className="bg-white dark:bg-gray-800/80 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    {[
                        { id: 'profile_image_border', label: 'Borde en Foto de Perfil', desc: 'Muestra un círculo de color alrededor de tu foto.' },
                        { id: 'card_shadow', label: 'Sombra en Tarjetas', desc: 'Sutil profundidad en servicios y recomendaciones.' },
                        { id: 'container_shadow', label: 'Sombra en Contenedores', desc: 'Elevación premium en cabeceras y bloques principales.' }
                    ].map((effect, idx) => (
                        <div key={effect.id} className={`flex items-center justify-between p-6 ${idx !== 2 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''}`}>
                            <div>
                                <h3 className="text-sm font-bold text-black dark:text-white">{effect.label}</h3>
                                <p className="text-[11px] text-gray-400 font-medium">{effect.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData[effect.id]}
                                    onChange={(e) => handleChange({ target: { name: effect.id, value: e.target.checked } })}
                                />
                                <div
                                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 transition-colors"
                                    style={{ backgroundColor: formData[effect.id] ? primaryColor : undefined }}
                                ></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AppearanceTab
