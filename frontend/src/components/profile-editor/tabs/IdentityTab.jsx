import React from 'react'
import Input from '../../common/Input'
import DragDropUpload from '../../features/DragDropUpload'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const IdentityTab = ({
    doctor,
    formData,
    handleChange,
    handleLogoUpload,
    handlePhotoUpload
}) => {
    const primaryColor = doctor?.theme_primary_color || '#4F46E5'

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Photos Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Logo Upload */}
                <div className="dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Logo Profesional</h2>
                    <DragDropUpload
                        type="logo"
                        currentUrl={doctor?.logo_url}
                        onUploadSuccess={handleLogoUpload}
                        primaryColor={primaryColor}
                        sideBySide={false}
                        compact={true}
                    />
                </div>

                {/* Photo Upload */}
                <div className="dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Foto de Perfil</h2>
                    <DragDropUpload
                        type="photo"
                        currentUrl={doctor?.photo_url}
                        onUploadSuccess={handlePhotoUpload}
                        primaryColor={primaryColor}
                        sideBySide={false}
                        compact={true}
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

            {/* Basic Information */}
            <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Nombre Completo"
                        name="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={handleChange}
                        required
                        className="border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        labelClassName="dark:text-gray-300"
                    />

                    <Input
                        label="Especialidad"
                        name="especialidad"
                        value={formData.especialidad}
                        onChange={handleChange}
                        placeholder="Ej: Ginecólogo - Obstetra"
                        className="border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        labelClassName="dark:text-gray-300"
                    />
                </div>

                <Input
                    label="Casa de Estudio (Universidad)"
                    name="universidad"
                    value={formData.universidad || ''}
                    onChange={handleChange}
                    placeholder="Ej: Universidad Central de Venezuela (UCV)"
                    className="border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    labelClassName="dark:text-gray-300"
                />

                <style>{`
          .ql-editor h2 {
            font-size: 1.875rem !important; /* text-3xl */
            font-weight: 700 !important;
            margin-bottom: 1rem !important;
            margin-top: 2rem !important;
          }
          .ql-editor p {
            font-size: 1.25rem !important; /* prose-xl p size */
          }
          /* Dark Mode Overrides for Quill */
          .dark .ql-snow .ql-editor {
            color: #ffffff !important;
          }
          .dark .ql-snow .ql-editor * {
            color: #ffffff !important;
          }
          .dark .ql-snow .ql-editor h2, 
          .dark .ql-snow .ql-editor h3 {
            color: #ffffff !important;
          }
          .dark .ql-toolbar {
             background-color: #374151; /* gray-700 */
             border-color: #4b5563 !important; /* gray-600 */
          }
          .dark .ql-container {
             border-color: #4b5563 !important; /* gray-600 */
             background-color: #1f2937; /* gray-800 */
          }
          /* Fix Toolbar Icons in Dark Mode */
          .dark .ql-snow .ql-stroke {
             stroke: #e5e7eb !important;
          }
          .dark .ql-snow .ql-fill {
             fill: #e5e7eb !important;
          }
          .dark .ql-snow .ql-picker {
             color: #e5e7eb !important;
          }
        `}</style>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                        Biografía
                    </label>
                    <ReactQuill
                        theme="snow"
                        value={formData.biografia || ''}
                        onChange={val => handleChange({ target: { name: 'biografia', value: val } })}
                        modules={{
                            toolbar: [
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                [{ 'color': [] }, { 'background': [] }],
                                [{ 'script': 'sub' }, { 'script': 'super' }],
                                [{ 'align': [] }],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                                ['link', 'image', 'video'],
                                ['clean']
                            ]
                        }}
                        className="bg-white dark:bg-gray-700 dark:text-white rounded-md"
                        style={{ minHeight: 180 }}
                        placeholder="Escribe tu biografía profesional..."
                    />
                </div>
            </div>
        </div>
    )
}

export default IdentityTab
