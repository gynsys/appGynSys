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
    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Theme Selector - Visual Cards */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Plantilla de Diseño (Tema)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DESIGN_TEMPLATES.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => handleChange({ target: { name: 'design_template', value: template.id } })}
                            className={`
                cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative
                ${(formData.design_template || 'glass') === template.id
                                    ? 'border-slate-600 dark:border-slate-400 bg-slate-50 dark:bg-slate-800/60 shadow-md transform scale-[1.02]'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                                }
              `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold ${(formData.design_template || 'glass') === template.id
                                    ? 'text-slate-900 dark:text-white'
                                    : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {template.label}
                                </span>
                                {(formData.design_template || 'glass') === template.id && (
                                    <div className="w-5 h-5 rounded-full bg-slate-800 dark:bg-white flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

            {/* Colors Section */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Personalización de Colores</h2>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6">
                    <div>
                        <label htmlFor="theme_primary_color" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                            Color Primario (Marca)
                        </label>
                        <div className="flex items-center gap-4">
                            <Input
                                name="theme_primary_color"
                                type="color"
                                value={formData.theme_primary_color}
                                onChange={handleChange}
                                className="border-gray-300 h-10 w-20 p-1 dark:bg-gray-700 dark:border-gray-600 cursor-pointer rounded-md"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{formData.theme_primary_color}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Este color se usará en botones, enlaces y elementos destacados.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="theme_body_bg_color" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                Fondo General de Página
                            </label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    name="theme_body_bg_color"
                                    type="color"
                                    value={formData.theme_body_bg_color || '#ffffff'}
                                    onChange={handleChange}
                                    className="border-gray-300 h-10 w-full p-1 dark:bg-gray-700 dark:border-gray-600 cursor-pointer rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'theme_body_bg_color', value: '' } })}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
                                >
                                    Restaurar
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="theme_container_bg_color" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                Fondo de Tarjetas/Contenedores
                            </label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    name="theme_container_bg_color"
                                    type="color"
                                    value={formData.theme_container_bg_color || '#ffffff'}
                                    onChange={handleChange}
                                    className="border-gray-300 h-10 w-full p-1 dark:bg-gray-700 dark:border-gray-600 cursor-pointer rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'theme_container_bg_color', value: '' } })}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
                                >
                                    Restaurar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

            {/* Shadows Control */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Efectos Visuales</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Profile Image Border Toggle */}
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Borde en Foto de Perfil</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Muestra un borde circular alrededor de tu foto.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.profile_image_border}
                                onChange={(e) => handleChange({ target: { name: 'profile_image_border', value: e.target.checked } })}
                            />
                            <div
                                className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
                            ></div>
                        </label>
                    </div>

                    {/* Card Shadow Toggle */}
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sombra en Tarjetas</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sombras suaves en elementos individuales como servicios o testimonios.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.card_shadow}
                                onChange={(e) => handleChange({ target: { name: 'card_shadow', value: e.target.checked } })}
                            />
                            <div
                                className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
                            ></div>
                        </label>
                    </div>

                    {/* Container Shadow Toggle */}
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sombra en Contenedores</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sombras en bloques grandes como el encabezado o pie de página.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.container_shadow}
                                onChange={(e) => handleChange({ target: { name: 'container_shadow', value: e.target.checked } })}
                            />
                            <div
                                className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
                            ></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppearanceTab
