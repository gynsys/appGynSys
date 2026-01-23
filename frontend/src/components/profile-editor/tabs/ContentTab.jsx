import React from 'react'
import CertificationsManager from '../CertificationsManager'
import TestimonialsSection from '../TestimonialsSection'
import FAQsSection from '../FAQsSection'

const ContentTab = ({
    doctor,
    formData,
    handleChange,
    testimonialsData,
    faqsData
}) => {
    const primaryColor = doctor?.theme_primary_color || '#4F46E5'

    return (
        <div className="space-y-12 animate-fadeIn">

            {/* Certifications Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
                    Acreditaciones y Títulos
                </h2>

                <div className="flex items-center justify-between border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mostrar carrusel de certificaciones</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Activa o desactiva la sección visual de acreditaciones y títulos.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.show_certifications_carousel || false}
                            onChange={(e) => handleChange({ target: { name: 'show_certifications_carousel', value: e.target.checked } })}
                        />
                        <div
                            className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
                            style={{ backgroundColor: formData.show_certifications_carousel ? primaryColor : undefined }}
                        ></div>
                    </label>
                </div>

                {formData.show_certifications_carousel && (
                    <div className="animate-fadeIn">
                        <CertificationsManager doctor={doctor} primaryColor={primaryColor} />
                    </div>
                )}
            </div>

            {/* Testimonials Section */}
            <div className="space-y-4">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8"></div>
                <TestimonialsSection {...testimonialsData} doctor={doctor} />
            </div>

            {/* FAQs Section */}
            <div className="space-y-4">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8"></div>
                <FAQsSection {...faqsData} doctor={doctor} />
            </div>

        </div>
    )
}

export default ContentTab
