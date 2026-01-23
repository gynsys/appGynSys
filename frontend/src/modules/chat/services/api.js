import axios from '@/lib/axios';

const PREFIX = '/chat';

export const chatApi = {
    // Rooms
    getRooms: () => axios.get(`${PREFIX}/rooms`),
    createRoom: (data) => axios.post(`${PREFIX}/rooms`, data),
    deleteRoom: (roomId) => axios.delete(`${PREFIX}/rooms/${roomId}`),

    // Messages
    getMessages: (roomId, page = 1) => axios.get(`${PREFIX}/rooms/${roomId}/messages`, { params: { page } }),
    sendMessage: (roomId, data) => axios.post(`${PREFIX}/rooms/${roomId}/messages`, data),

    // Media
    getPresignedUrl: (filename, contentType) => axios.post(`${PREFIX}/media/presigned-url`, { filename, contentType }),

    // Upload Helper (direct to S3/MinIO)
    uploadToS3: async (uploadUrl, file) => {
        // Must remove Authorization header for S3 PUT usually, or create new instance
        // Using fetch to avoid interceptors attaching auth headers which S3 rejects
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        if (!response.ok) {
            throw new Error('Failed to upload media');
        }
        return true;
    }
};
