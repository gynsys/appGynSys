import React, { useState, useEffect, useRef } from 'react';
import { FiTrash2, FiFile, FiImage, FiVideo, FiDownload } from 'react-icons/fi';
import { FileUploader } from './FileUploader';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';

export const ConsultationAssetManager = ({ consultationId, initialAssets = [], onAssetsChange }) => {
    const [assets, setAssets] = useState(initialAssets);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const hasFetchedForId = useRef(null);

    useEffect(() => {
        // Only fetch if we have an ID and haven't fetched for this specific ID yet
        if (consultationId && hasFetchedForId.current !== consultationId) {
            hasFetchedForId.current = consultationId;
            fetchAssets();
        } else if (!consultationId && initialAssets.length > 0) {
            // Buffer mode initialization
            setAssets(initialAssets);
        }
    }, [consultationId, initialAssets]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/consultations/${consultationId}/data`);
            if (response.data && response.data.assets) {
                setAssets(response.data.assets);
                if (onAssetsChange) onAssetsChange(response.data.assets);
            }
        } catch (error) {
            console.error('Error fetching consultation assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMultipleFilesUpload = async (files) => {
        if (!consultationId) {
            // Buffer mode batch process
            setAssets(prev => {
                let newAssets = [...prev];
                files.forEach((file, index) => {
                    const previewUrl = URL.createObjectURL(file);
                    const tempAsset = {
                        id: `temp_${Date.now()}_${index}`,
                        file_name: file.name,
                        file_path: previewUrl,
                        file_type: file.type || 'application/octet-stream',
                        file_size_bytes: file.size,
                        rawFile: file // Keep raw file for later upload
                    };
                    newAssets.push(tempAsset);
                });
                if (onAssetsChange) onAssetsChange(newAssets);
                return newAssets;
            });
            return;
        }

        setIsUploading(true);
        let successes = 0;
        let failures = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            try {
                const response = await api.post(`/consultations/${consultationId}/assets`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                setAssets(prev => {
                    const newAssets = [...prev, response.data];
                    if (onAssetsChange) onAssetsChange(newAssets);
                    return newAssets;
                });
                successes++;
            } catch (error) {
                console.error('Error uploading asset:', error);
                failures++;
            }
        }

        setIsUploading(false);

        if (successes > 0 && failures === 0) {
            toast.success(files.length > 1 ? `${successes} archivos subidos` : 'Archivo subido correctamente');
        } else if (successes > 0 && failures > 0) {
            toast.success(`Se subieron ${successes} archivos, pero fallaron ${failures}`);
        } else if (failures > 0) {
            toast.error('Error al subir los archivos');
        }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

        if (String(assetId).startsWith('temp_')) {
            // Offline buffer mode
            const filteredAssets = assets.filter(a => a.id !== assetId);
            setAssets(filteredAssets);
            if (onAssetsChange) onAssetsChange(filteredAssets);
            return;
        }

        try {
            await api.delete(`/consultations/assets/${assetId}`);
            const filteredAssets = assets.filter(a => a.id !== assetId);
            setAssets(filteredAssets);
            if (onAssetsChange) onAssetsChange(filteredAssets);
            toast.success('Archivo eliminado');
        } catch (error) {
            console.error('Error deleting asset:', error);
            toast.error('Error al eliminar el archivo');
        }
    };

    const renderIcon = (fileType) => {
        if (fileType.startsWith('image/')) return <FiImage className="w-8 h-8 text-indigo-500" />;
        if (fileType.startsWith('video/')) return <FiVideo className="w-8 h-8 text-indigo-500" />;
        return <FiFile className="w-8 h-8 text-indigo-500" />;
    };

    const isImage = (fileType) => fileType.startsWith('image/');

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Adjuntar Nuevos Archivos</h4>
                <div className="relative">
                    {isUploading && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex items-center justify-center rounded-xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    )}
                    <FileUploader
                        title="Arrastra y suelta tus imágenes o videos aquí"
                        subtitle="o haz clic para buscar Soportes Multimedias"
                        multiple={true}
                        onFilesSelect={(files) => { if (files && files.length > 0) handleMultipleFilesUpload(files); }}
                        onFileSelect={(file) => { if (file) handleMultipleFilesUpload([file]); }}
                        acceptedFormats={['.jpg', '.jpeg', '.png', '.mp4', '.pdf', '.doc', '.docx']}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4 text-sm text-gray-500">Cargando archivos...</div>
            ) : assets.length > 0 ? (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Soportes Subidos ({assets.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {assets.map((asset) => (
                            <div key={asset.id} className="relative group bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-500 transition-colors">
                                <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    {isImage(asset.file_type) ? (
                                        <img
                                            src={asset.file_path}
                                            alt={asset.file_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                                        />
                                    ) : (
                                        renderIcon(asset.file_type)
                                    )}
                                </div>

                                <div className="p-3">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={asset.file_name}>
                                        {asset.file_name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        {asset.file_size_bytes ? `${(asset.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : 'Desconocido'}
                                    </p>
                                </div>

                                {/* Actions overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-sm">
                                    <a
                                        href={asset.file_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="Ver / Descargar"
                                    >
                                        <FiDownload className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(asset.id)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 border border-dashed rounded-xl border-gray-200 dark:border-gray-700">
                    No hay imágenes ni soportes multimedia guardados en esta consulta.
                </div>
            )}
        </div>
    );
};
