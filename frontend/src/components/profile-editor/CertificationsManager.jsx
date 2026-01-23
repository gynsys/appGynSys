import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import Button from '../common/Button';
import Input from '../common/Input';
import DragDropUpload from '../features/DragDropUpload';
import Modal from '../common/Modal';
import { useToastStore } from '../../store/toastStore';
import { getImageUrl } from '../../lib/imageUtils';

const CertificationsManager = ({ doctor, primaryColor }) => {
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newCert, setNewCert] = useState({
        name: '',
        title: '',
        logo_url: '',
        order: 0
    });
    const { success, error: toastError } = useToastStore();

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [certToDelete, setCertToDelete] = useState(null);

    const apiBase = '/users/certifications';

    useEffect(() => {
        fetchCertifications();
    }, []);

    const fetchCertifications = async () => {
        try {
            const response = await api.get(apiBase);
            setCertifications(response.data);
        } catch (error) {
            console.error('Error fetching certifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCert.logo_url) {
            toastError('Por favor sube un logo primero');
            return;
        }
        setSubmitting(true);
        try {
            const response = await api.post(apiBase, newCert);
            setCertifications([...certifications, response.data]);
            setNewCert({ name: '', title: '', logo_url: '', order: 0 });
            success('Acreditación agregada correctamente');
        } catch (error) {
            console.error('Error adding certification:', error);
            toastError('Error al agregar la acreditación');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (cert) => {
        setCertToDelete(cert);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!certToDelete) return;
        try {
            await api.delete(`${apiBase}/${certToDelete.id}`);
            setCertifications(certifications.filter(c => c.id !== certToDelete.id));
            success('Acreditación eliminada');
            setDeleteModalOpen(false);
            setCertToDelete(null);
        } catch (error) {
            console.error('Error deleting certification:', error);
            toastError('Error al eliminar la acreditación');
        }
    };

    const handleLogoUpload = (url) => {
        setNewCert(prev => ({ ...prev, logo_url: url }));
    };

    if (loading) return <div className="py-4 text-center">Cargando certificaciones...</div>;

    return (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 dark:text-white">Gestión de Títulos y Acreditaciones</h2>

            {/* List of existing certifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <div className="w-16 h-16 mr-4 flex-shrink-0 bg-white rounded p-1 flex items-center justify-center">
                            <img
                                src={getImageUrl(cert.logo_url)}
                                alt={cert.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{cert.name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{cert.title}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDeleteClick(cert)}
                            className="text-red-500 hover:text-red-700 p-2"
                            title="Eliminar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Form to add new certification */}
            <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Agregar Nueva Acreditación</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Institución / Universidad"
                            placeholder="Ej: Universidad de Antioquia"
                            value={newCert.name}
                            onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                            className="dark:bg-gray-700 border-gray-400 dark:text-white"
                            labelClassName="dark:text-gray-300"
                        />
                        <Input
                            label="Título / Cargo"
                            placeholder="Ej: Médica Cirujana"
                            value={newCert.title}
                            onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                            className="dark:bg-gray-700 border-gray-400 dark:text-white"
                            labelClassName="dark:text-gray-300"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Logo de la Institución</label>
                        <DragDropUpload
                            type="certification_logo"
                            currentUrl={newCert.logo_url}
                            onUploadSuccess={handleLogoUpload}
                            primaryColor={primaryColor}
                            sideBySide={true}
                        />
                    </div>

                    <div className="flex justify-center">
                        <Button
                            onClick={handleAdd}
                            disabled={submitting || !newCert.name || !newCert.title || !newCert.logo_url}
                            style={{ backgroundColor: primaryColor }}
                            className="text-white"
                        >
                            {submitting ? 'Agregando...' : 'Agregar Acreditación'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Confirmar Eliminación"
                size="sm"
            >
                <div className="p-1">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        ¿Estás seguro de que deseas eliminar la acreditación de <strong>{certToDelete?.name}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CertificationsManager;
