import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiMic, FiSquare, FiTrash2, FiLoader } from 'react-icons/fi';
import useAudioRecorder from '../hooks/useAudioRecorder';
import { chatApi } from '../services/api';

const InputArea = ({ onSend, disabled }) => {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Audio Recorder
    const {
        isRecording,
        startRecording,
        stopRecording,
        mediaBlobUrl,
        audioBlob,
        reset: resetAudio
    } = useAudioRecorder();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.max(textareaRef.current.scrollHeight, 44); // Min 44px
            textareaRef.current.style.height = `${Math.min(newHeight, 120)}px`;
        }
    }, [message]);

    const handleSendText = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSend(message, 'text');
        setMessage('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText(e);
        }
    };

    // --- File Handling ---
    const handleAttachClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Get Presigned URL
            const { data } = await chatApi.getPresignedUrl(file.name, file.type);
            const { uploadUrl, publicUrl, mediaMeta } = data;

            // 2. Upload to S3
            await chatApi.uploadToS3(uploadUrl, file);

            // 3. Send Message
            const type = file.type.startsWith('image/') ? 'image' : 'file';
            await onSend(null, type, publicUrl, mediaMeta);

        } catch (error) {
            console.error('Upload failed', error);
            alert('Error al subir archivo');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    // --- Audio Handling ---
    const handleStopAndSend = async () => {
        stopRecording();
        // Wait for audioBlob to update? 
        // useReactMediaRecorder updates mediaBlobUrl/status asynchronously.
        // We probably need to wait or rely on an effect. 
        // But for simplicity let's use a "Review" step or just assume the blob is ready shortly?
        // Actually, stopRecording() is void. We need to handle the blob in an effect or use stopRecording callback if available (it isn't in simple hook).
        // Let's change UI: Click "Stop" -> Shows "Send Audio" button. 
    };

    const handleSendAudio = async () => {
        if (!audioBlob) return;

        setIsUploading(true);
        try {
            const filename = `voice-note-${Date.now()}.wav`;
            const contentType = 'audio/wav'; // or audio/webm depending on browser

            // 1. Get Presigned URL
            const { data } = await chatApi.getPresignedUrl(filename, contentType);
            const { uploadUrl, publicUrl, mediaMeta } = data;

            // 2. Upload
            await chatApi.uploadToS3(uploadUrl, audioBlob);

            // 3. Send
            await onSend(null, 'voice', publicUrl, mediaMeta);
            resetAudio();

        } catch (error) {
            console.error('Audio upload failed', error);
            alert('Error al enviar nota de voz');
        } finally {
            setIsUploading(false);
        }
    };

    // --- Render ---
    return (
        <div className="p-4 relative">
            {/* Loading Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                        <FiLoader className="animate-spin w-5 h-5" /> Subiendo...
                    </div>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,application/pdf,.doc,.docx"
            />

            <div className="flex items-end gap-2 max-w-4xl mx-auto">

                {/* Mode: Recording */}
                {isRecording || audioBlob ? (
                    <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/10 rounded-2xl p-2 px-4 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                                {isRecording ? "Grabando..." : "Audio listo para enviar"}
                            </span>
                            {/* Playback preview if stopped */}
                            {audioBlob && mediaBlobUrl && (
                                <audio src={mediaBlobUrl} controls className="h-8 w-48" />
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetAudio}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                title="Cancelar"
                            >
                                <FiTrash2 className="w-5 h-5" />
                            </button>

                            {isRecording ? (
                                <button
                                    onClick={stopRecording}
                                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                    title="Detener"
                                >
                                    <FiSquare className="w-4 h-4 fill-current" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSendAudio}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md"
                                    title="Enviar Audio"
                                >
                                    <FiSend className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Mode: Default Input */
                    /* Mode: Default Input */
                    <>
                        <button
                            type="button"
                            onClick={handleAttachClick}
                            disabled={disabled || isUploading}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-2"
                        >
                            <FiPaperclip className="w-5 h-5" />
                        </button>

                        <div className="relative flex-1 flex items-center">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe un mensaje..."
                                disabled={disabled || isUploading}
                                rows={1}
                                className="w-full py-2 px-4 pr-14 border-2 border-gray-300 dark:border-gray-600 rounded-full text-lg transition-colors bg-white dark:bg-gray-800 dark:text-white shadow-sm dark:shadow-none resize-none focus:outline-none focus:border-indigo-500 leading-normal"
                                style={{ minHeight: '44px', maxHeight: '120px' }}
                            />

                            {/* Send / Mic Button positioned absolute right */}
                            {message.trim() ? (
                                <button
                                    onClick={handleSendText}
                                    disabled={disabled || isUploading}
                                    className="absolute right-2 p-2 text-white rounded-full disabled:opacity-50 transition-none flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 shadow-md"
                                >
                                    <FiSend className="w-4 h-4 ml-0.5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={disabled || isUploading}
                                    className="absolute right-2 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex items-center justify-center"
                                >
                                    <FiMic className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default InputArea;
