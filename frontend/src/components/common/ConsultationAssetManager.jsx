import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiTrash2, FiFile, FiImage, FiVideo, FiDownload, FiEye, FiX, FiUploadCloud } from 'react-icons/fi';
import { FileUploader } from './FileUploader';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { openExternalFile, isCapacitor } from '../../utils/platform';

// Helper for transparency
const hexToRgba = (hex, alpha) => {
  try {
    if (!hex || hex === 'transparent') return 'transparent';
    let r, g, b;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex.slice(0, 1).repeat(2), 16);
      g = parseInt(cleanHex.slice(1, 2).repeat(2), 16);
      b = parseInt(cleanHex.slice(2, 3).repeat(2), 16);
    } else {
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return hex;
  }
};

export const ConsultationAssetManager = ({ consultationId, initialAssets = [], onAssetsChange, readOnly = false, primaryColor = '#4F46E5', isDarkTheme = false }) => {
    const [assets, setAssets] = useState(initialAssets);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previewAsset, setPreviewAsset] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);
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
        if (fileType.startsWith('image/')) return <FiImage className="w-8 h-8" style={{ color: primaryColor }} />;
        if (fileType.startsWith('video/')) return <FiVideo className="w-8 h-8" style={{ color: primaryColor }} />;
        return <FiFile className="w-8 h-8" style={{ color: primaryColor }} />;
    };

    const isImage = (fileType) => fileType.startsWith('image/');
    const isVideo = (fileType) => fileType.startsWith('video/');
    const isPdf = (fileType) => fileType === 'application/pdf';

    // Drag and drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleMultipleFilesUpload(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleMultipleFilesUpload(Array.from(e.target.files));
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. Área de Subida de Nuevos Archivos (Oculta en modo solo lectura) - AHORA PRIMERO */}
            {!readOnly && (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${
                        dragActive ? 'scale-[0.99]' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                    style={dragActive ? { 
                        borderColor: primaryColor, 
                        backgroundColor: hexToRgba(primaryColor, 0.05) 
                    } : {}}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        accept=".jpg,.jpeg,.png,.mp4,.pdf,.doc,.docx"
                    />

                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div 
                            className="p-2 rounded-full shadow-sm transition-colors"
                            style={dragActive ? { 
                                backgroundColor: hexToRgba(primaryColor, 0.1), 
                                color: primaryColor 
                            } : { 
                                backgroundColor: isDarkTheme ? '#1f2937' : 'white', 
                                color: '#9ca3af' 
                            }}
                        >
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: primaryColor }}></div>
                            ) : (
                                <FiUploadCloud className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {isUploading ? 'Subiendo...' : 'Haz clic o arrastra archivos aquí'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                Máx 10MB
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Soportes Subidos (Mostrados Solo si existen) - AHORA DEBAJO */}
            {assets.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center justify-between">
                        <span>Soportes Subidos ({assets.length})</span>
                    </h4>
                    {loading ? (
                        <div className="text-center py-4 text-sm text-gray-500">Cargando archivos...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {assets.map((asset) => (
                        <div 
                            key={asset.id} 
                            className="relative bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors shadow-sm"
                            style={{ '--hover-border': primaryColor }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = isDarkTheme ? '#374151' : '#e5e7eb'}
                        >
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
                                                className="p-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md transition-colors"
                                                style={{ transition: 'all 0.2s' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = hexToRgba(primaryColor, 0.1);
                                                    e.currentTarget.style.color = primaryColor;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = isDarkTheme ? '#374151' : 'white';
                                                    e.currentTarget.style.color = isDarkTheme ? '#f3f4f6' : '#1f2937';
                                                }}
                                                title="Ver archivo"
                                            >
                                                <FiEye className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openExternalFile(getFullUrl(asset.file_path))}
                                            className="p-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md transition-colors"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = hexToRgba(primaryColor, 0.1);
                                                e.currentTarget.style.color = primaryColor;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = isDarkTheme ? '#374151' : 'white';
                                                e.currentTarget.style.color = isDarkTheme ? '#f3f4f6' : '#1f2937';
                                            }}
                                            title="Descargar"
                                        >
                                            <FiDownload className="w-3.5 h-3.5" />
                                        </button>
                                        {!readOnly && (
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
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
                    )}
                </div>
            )}

            {/* Fullscreen Assets Preview Modal (Lightbox) via Portal */}
            {previewAsset && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
                    <div className="absolute top-4 right-4 flex z-10">
                        <button
                            onClick={() => setPreviewAsset(null)}
                            className="text-white/70 hover:text-white bg-black/40 p-2 rounded-full transition-colors"
                            title="Cerrar"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="w-full h-full flex items-center justify-center p-0 md:p-4">
                        {isVideo(previewAsset.file_type) ? (
                            <video
                                src={getFullUrl(previewAsset.file_path)}
                                controls
                                autoPlay
                                className="max-w-full max-h-full rounded-none md:rounded-lg shadow-2xl bg-black"
                            />
                        ) : isImage(previewAsset.file_type) ? (
                            <img
                                src={getFullUrl(previewAsset.file_path)}
                                alt={previewAsset.file_name}
                                className="w-full h-full md:max-w-full md:max-h-full rounded-none md:rounded-lg shadow-2xl object-contain bg-black"
                            />
                        ) : isPdf(previewAsset.file_type) ? (
                            <iframe
                                src={getFullUrl(previewAsset.file_path)}
                                className="w-full h-full rounded-none md:rounded-lg bg-white border-0"
                                title={previewAsset.file_name}
                            />
                        ) : (
                            <div className="text-white bg-gray-800 p-8 rounded-xl text-center flex flex-col items-center justify-center w-full h-full">
                                <FiFile className="w-16 h-16 mb-4 opacity-50 mx-auto" />
                                <p>Vista previa no disponible para este formato.</p>
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10">
                        <button
                            onClick={() => openExternalFile(getFullUrl(previewAsset.file_path))}
                            className="text-white transition-colors flex items-center space-x-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
                            onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                        >
                            <FiDownload className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {isCapacitor() ? 'Abrir en Navegador' : 'Descargar original'}
                            </span>
                        </button>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm z-10 bg-black/40 py-1">
                        {previewAsset.file_name}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
