import Dexie from 'dexie';

export const db = new Dexie('ChatDatabase');

db.version(1).stores({
    rooms: 'id, tenant_id, updated_at', // Primary index and indexes
    messages: 'id, room_id, created_at, [room_id+created_at]', // Compound index for queries
    queue: '++id, status, created_at' // For offline sync queue
});

export const chatStorage = {
    // --- Message Operations ---
    async saveMessage(message) {
        return await db.messages.put(message);
    },

    async saveMessages(messages) {
        return await db.messages.bulkPut(messages);
    },

    async getMessages(roomId, limit = 50, offset = 0) {
        return await db.messages
            .where('room_id')
            .equals(roomId)
            .reverse() // Newest first
            .offset(offset)
            .limit(limit)
            .sortBy('created_at');
    },

    async getLastMessage(roomId) {
        return await db.messages
            .where('room_id')
            .equals(roomId)
            .reverse()
            .sortBy('created_at')
            .then(msgs => msgs[0]);
    },

    // --- Room Operations ---
    async saveRoom(room) {
        return await db.rooms.put(room);
    },

    async saveRooms(rooms) {
        return await db.rooms.bulkPut(rooms);
    },

    async getRooms(tenantId) {
        return await db.rooms
            .where('tenant_id')
            .equals(tenantId)
            .sortBy('updated_at')
            .then(rooms => rooms.reverse()); // Most recently updated first
    },

    // --- Offline Queue Operations ---
    async addToQueue(action) {
        // action: { type: 'SEND_MESSAGE', payload: {}, retryCount: 0 }
        return await db.queue.add({
            ...action,
            status: 'pending',
            created_at: new Date().toISOString()
        });
    },

    async getQueue() {
        return await db.queue
            .where('status')
            .equals('pending')
            .sortBy('created_at');
    },

    async removeFromQueue(id) {
        return await db.queue.delete(id);
    },

    async updateQueueStatus(id, status, error = null) {
        return await db.queue.update(id, { status, error });
    },

    async deleteRoom(roomId) {
        // Delete room and all its messages from IndexedDB
        await db.rooms.delete(roomId);
        await db.messages.where('room_id').equals(roomId).delete();
    }
};

export { chatStorage as default, db as chatDb };
