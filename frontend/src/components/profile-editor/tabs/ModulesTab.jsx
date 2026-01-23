import React from 'react'
import * as Switch from '@radix-ui/react-switch'

const ModulesTab = ({ doctor, formData, handleChange }) => {
    const primaryColor = doctor?.theme_primary_color || '#4F46E5'

    // Helper to handle switch changes
    const handleToggle = (code, checked) => {
        const currentModules = formData.enabled_modules || []
        let newModules

        if (checked) {
            if (!currentModules.includes(code)) {
                newModules = [...currentModules, code]
            } else {
                newModules = currentModules
            }
        } else {
            newModules = currentModules.filter(c => c !== code)
        }

        // Simulate generic change event for useProfileData
        handleChange({
            target: {
                name: 'enabled_modules',
                value: newModules
            }
        })
    }

    // Use doctor.modules_status if available (backend source of truth for available modules)
    // If not available (e.g. backend not updated yet or error), fallback to empty or some default
    const availableModules = (doctor?.modules_status || []).filter(m => m.code !== 'preconsultation')

    if (availableModules.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No hay módulos disponibles para configurar.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="border-b pb-4 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                    Módulos del Sitio
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Activa o desactiva las secciones que deseas mostrar en tu página de perfil.
                </p>
            </div>

            {/* Standard Sections */}
            <div>

                <div className="space-y-4">
                    {availableModules
                        .filter(m => ['gallery', 'testimonials', 'services', 'locations', 'faqs', 'certifications', 'online_consultation'].includes(m.code))
                        .map((module) => {
                            const isEnabled = (formData.enabled_modules || []).includes(module.code)
                            return (
                                <div
                                    key={module.code}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                                >
                                    <div className="flex-1 pr-4">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {module.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                                    </div>
                                    <Switch.Root
                                        checked={isEnabled}
                                        onCheckedChange={(checked) => handleToggle(module.code, checked)}
                                        className={`w-[42px] h-[25px] rounded-full relative shadow-[0_2px_10px] shadow-blackA7 outline-none cursor-default transition-colors duration-200 ease-in-out ${isEnabled ? '' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        style={{ backgroundColor: isEnabled ? primaryColor : undefined }}
                                    >
                                        <Switch.Thumb
                                            className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA7 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
                                        />
                                    </Switch.Root>
                                </div>
                            )
                        })}
                </div>
            </div>

            {/* Premium Modules */}
            <div>
                <div className="space-y-4">
                    {availableModules
                        .filter(m => ['endometriosis_test', 'blog', 'cycle_predictor', 'recommendations', 'chat'].includes(m.code))
                        .map((module) => {
                            const isEnabled = (formData.enabled_modules || []).includes(module.code)
                            const isAvailableForUser = module.is_enabled_for_user !== false

                            return (
                                <div
                                    key={module.code}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-opacity ${!isAvailableForUser
                                        ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
                                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                {module.name}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                                    </div>

                                    <Switch.Root
                                        disabled={!isAvailableForUser}
                                        checked={isEnabled}
                                        onCheckedChange={(checked) => handleToggle(module.code, checked)}
                                        className={`w-[42px] h-[25px] rounded-full relative shadow-[0_2px_10px] shadow-blackA7 outline-none cursor-default transition-colors duration-200 ease-in-out ${isEnabled ? '' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        style={{ backgroundColor: isEnabled && isAvailableForUser ? primaryColor : undefined }}
                                    >
                                        <Switch.Thumb
                                            className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA7 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
                                        />
                                    </Switch.Root>
                                </div>
                            )
                        })}
                </div>
            </div>
        </div>
    )
}

export default ModulesTab
