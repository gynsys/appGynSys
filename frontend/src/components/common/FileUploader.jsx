import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFile, FiX, FiCheckCircle } from 'react-icons/fi';

export const FileUploader = ({ onFileSelect, onFilesSelect, multiple = false, acceptedFormats = ['.pdf', '.xlsx', '.xls', '.doc', '.docx'] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const isValidFormat = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return acceptedFormats.includes(fileExtension);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (multiple) {
        handleMultipleFiles(files);
      } else {
        validateAndSetFile(files[0]);
      }
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        handleMultipleFiles(files);
      } else {
        validateAndSetFile(files[0]);
      }
    }
  };

  const handleMultipleFiles = (files) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter(isValidFormat);

    if (validFiles.length !== fileList.length) {
      alert(`Algunos archivos tienen un formato no soportado. Formatos admitidos: ${acceptedFormats.join(', ')}`);
    }

    if (validFiles.length > 0 && onFilesSelect) {
      onFilesSelect(validFiles);
    }

    // Clear input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndSetFile = (file) => {
    if (isValidFormat(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert(`Formato no soportado. Por favor sube un archivo: ${acceptedFormats.join(', ')}`);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full mb-6">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
              : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/80'
            }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInput}
            multiple={multiple}
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className={`p-3 rounded-full ${isDragging ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
              <FiUploadCloud size={32} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                Arrastra y suelta tu formato de historia médica aquí
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                o haz clic para seleccionar (PDF, Excel, Word)
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {acceptedFormats.map(ext => (
                <span key={ext} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-md font-mono">
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FiFile size={24} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            title="Eliminar archivo"
          >
            <FiX size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
