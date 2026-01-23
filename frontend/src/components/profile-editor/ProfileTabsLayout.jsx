import React, { useState } from 'react'
import Button from '../common/Button'
import IdentityTab from './tabs/IdentityTab'
import AppearanceTab from './tabs/AppearanceTab'
import ContactTab from './tabs/ContactTab'
import ContentTab from './tabs/ContentTab'
import ModulesTab from './tabs/ModulesTab'

const ProfileTabsLayout = ({
    doctor,
    formData,
    saving,
    handleChange,
    handleSubmit,
    handleLogoUpload,
    handlePhotoUpload,
    testimonialsData,
    faqsData
}) => {
    const [activeTab, setActiveTab] = useState('identity')
    const primaryColor = doctor?.theme_primary_color || '#4F46E5'

    const tabs = [
        {
            id: 'identity', label: 'Identidad', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )
        },
        {
            id: 'appearance', label: 'Apariencia', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
            )
        },
        {
            id: 'contact', label: 'Contacto', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            )
        },
        {
            id: 'content', label: 'Contenido', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            )
        },
        {
            id: 'modules', label: 'Módulos', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            )
        }
    ]

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'identity':
                return <IdentityTab
                    doctor={doctor}
                    formData={formData}
                    handleChange={handleChange}
                    handleLogoUpload={handleLogoUpload}
                    handlePhotoUpload={handlePhotoUpload}
                />
            case 'appearance':
                return <AppearanceTab
                    doctor={doctor}
                    formData={formData}
                    handleChange={handleChange}
                />
            case 'contact':
                return <ContactTab
                    doctor={doctor}
                    formData={formData}
                    handleChange={handleChange}
                />
            case 'content':
                return <ContentTab
                    doctor={doctor}
                    formData={formData}
                    handleChange={handleChange}
                    testimonialsData={testimonialsData}
                    faqsData={faqsData}
                />
            case 'modules':
                return <ModulesTab
                    doctor={doctor}
                    formData={formData}
                    handleChange={handleChange}
                />
            default:
                return null
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 overflow-hidden">

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex overflow-x-auto no-scrollbar justify-center">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap
                  ${isActive
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-gray-800'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                                    }
                `}
                                style={isActive ? { borderColor: primaryColor, color: primaryColor } : {}}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Save Button specific for Form Data (Visible always) */}
            <form onSubmit={handleSubmit}>
                {/* Main Content Area */}
                <div className="p-6 md:p-8">
                    {renderActiveTab()}
                </div>

                {/* Global form actions */}
                <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4 sticky bottom-0 z-10 backdrop-blur-md">
                    <span className="text-xs text-gray-400 self-center hidden sm:block">
                        {saving ? 'Guardando cambios...' : 'Recuerda guardar al finalizar tus cambios.'}
                    </span>
                    <Button
                        type="submit"
                        disabled={saving}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default ProfileTabsLayout
