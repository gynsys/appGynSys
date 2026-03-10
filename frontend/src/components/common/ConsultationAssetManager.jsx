import React, { useState, useEffect, useRef } from 'react';
import { FiTrash2, FiFile, FiImage, FiVideo, FiDownload, FiEye, FiX } from 'react-icons/fi';
import { FileUploader } from './FileUploader';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';

export const ConsultationAssetManager = ({ consultationId, initialAssets = [], onAssetsChange }) => {
    const [assets, setAssets] = useState(initialAssets);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previewAsset, setPreviewAsset] = useState(null);
    const hasFetchedForId = useRef(null);

    // Helper to resolve absolute URL for backend static files
    const getFullUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('blob:')) return path;

        let backendUrl = '';
        if (import.meta.env.VITE_API_BASE_URL) {
            backendUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '');
        }
        return `${backendUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

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
    const isVideo = (fileType) => fileType.startsWith('video/');
    const isPdf = (fileType) => fileType === 'application/pdf';

    return (
        <div className="space-y-8">
            {/* 1. Soportes Subidos (Mostrados Primero) */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center justify-between">
                    <span>Soportes Subidos ({assets.length})</span>
                </h4>
                {loading ? (
                    <div className="text-center py-4 text-sm text-gray-500">Cargando archivos...</div>
                ) : assets.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {assets.map((asset) => (
                            <div key={asset.id} className="relative bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-500 transition-colors shadow-sm">
                                <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    {isImage(asset.file_type) ? (
                                        <img
                                            src={getFullUrl(asset.file_path)}
                                            alt={asset.file_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                                        />
                                    ) : isVideo(asset.file_type) ? (
                                        <div className="relative w-full h-full">
                                            <video
                                                src={getFullUrl(asset.file_path)}
                                                className="w-full h-full object-cover"
                                                muted
                                                preload="metadata"
                                                playsInline
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                                                    <FiVideo className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        renderIcon(asset.file_type)
                                    )}
                                </div>

                                {/* Acciones estáticas en la esquina superior derecha, tamaño reducido un ~15% */}
                                <div className="absolute top-2 right-2 flex space-x-1 bg-white/80 dark:bg-black/60 shadow-sm backdrop-blur-md rounded-lg p-1 opacity-100">
                                    {(isImage(asset.file_type) || isVideo(asset.file_type) || isPdf(asset.file_type)) && (
                                        <button
                                            onClick={() => setPreviewAsset(asset)}
                                            className="p-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition-colors"
                                            title="Ver archivo"
                                        >
                                            <FiEye className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <a
                                        href={getFullUrl(asset.file_path)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition-colors"
                                        title="Descargar"
                                        download
                                    >
                                        <FiDownload className="w-3.5 h-3.5" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(asset.id)}
                                        className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="p-3 bg-white dark:bg-gray-800">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={asset.file_name}>
                                        {asset.file_name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        {asset.file_size_bytes ? `${(asset.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : 'Desconocido'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 border border-dashed rounded-xl border-gray-200 dark:border-gray-700">
                        No hay imágenes ni soportes multimedia previamente guardados.
                    </div>
                )}
            </div>

            {/* 2. Área de Subida de Nuevos Archivos (Mostrada al Final) */}
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

            {/* Fullscreen Assets Preview Modal (Lightbox) */}
            {previewAsset && (
                <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
                    <div className="absolute top-4 right-4 flex space-x-4">
                        <a
                            href={getFullUrl(previewAsset.file_path)}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-indigo-400 transition-colors flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-full"
                        >
                            <FiDownload className="w-5 h-5" />
                            <span className="text-sm font-medium">Descargar original</span>
                        </a>
                        <button
                            onClick={() => setPreviewAsset(null)}
                            className="text-white/70 hover:text-white bg-black/40 p-2 rounded-full transition-colors"
                            title="Cerrar"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    <div className={`w-full h-full flex items-center justify-center ${isPdf(previewAsset.file_type) ? 'p-0 pt-16 pb-12 md:pb-4' : 'max-w-5xl max-h-[85vh] p-4'}`}>
                        {isVideo(previewAsset.file_type) ? (
                            <video
                                src={getFullUrl(previewAsset.file_path)}
                                controls
                                autoPlay
                                className="max-w-full max-h-full rounded-lg shadow-2xl bg-black"
                            />
                        ) : isImage(previewAsset.file_type) ? (
                            <img
                                src={getFullUrl(previewAsset.file_path)}
                                alt={previewAsset.file_name}
                                className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                            />
                        ) : isPdf(previewAsset.file_type) ? (
                            <iframe
                                src={getFullUrl(previewAsset.file_path)}
                                className="w-full h-full rounded-none md:rounded-lg bg-white border-0"
                                title={previewAsset.file_name}
                            />
                        ) : (
                            <div className="text-white bg-gray-800 p-8 rounded-xl text-center">
                                <FiFile className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Vista previa no disponible para este formato.</p>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
                        {previewAsset.file_name}
                    </div>
                </div>
            )}
        </div>
    );
};
