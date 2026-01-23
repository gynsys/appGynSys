import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi';
import { getImageUrl } from '../../lib/imageUtils';

export const ImageUpload = ({ label, currentImage, onImageChange, className = "" }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const inputRef = useRef(null);

  // Update preview when currentImage prop changes (e.g. loaded from API)
  React.useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Create a local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // Pass the file back to parent
    if (onImageChange) {
      onImageChange(file, objectUrl);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onImageChange) {
      onImageChange(null, null);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
          ${preview ? "border-solid border-gray-200 bg-white" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />

        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center p-2 group">
            <img 
              src={getImageUrl(preview)}
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-lg" 
              onError={(e) => {
                  console.error("Image load error", preview);
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
              <button
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all transform hover:scale-110"
                title="Eliminar imagen"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className={`p-3 rounded-full mb-3 ${dragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                <FiUploadCloud className="w-8 h-8" />
            </div>
            <p className="mb-1 text-sm text-gray-900 font-semibold">
              <span className="text-blue-600">Haz clic para subir</span> o arrastra y suelta
            </p>
            <p className="text-xs text-gray-500">SVG, PNG, JPG o GIF (max. 2MB)</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-center">
        <button
            type="button"
            onClick={onButtonClick}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2 py-1 px-3 rounded-md hover:bg-gray-50"
        >
            <FiImage className="w-4 h-4" />
            Seleccionar archivo del dispositivo
        </button>
      </div>
    </div>
  );
};
