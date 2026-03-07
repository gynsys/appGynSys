import { create } from 'zustand';
import notificationService from '../services/notificationService';

const useNotificationStore = create((set, get) => ({
    rules: [],
    health: null,
    loading: false,
    loadingHealth: false,
    error: null,
    lastFetch: null,

    // Fetch all notification rules
    fetchRules: async (force = false) => {
        const { lastFetch, loading } = get();
        // ... (rest of fetchRules logic as is)
        if (!force && lastFetch && Date.now() - lastFetch < 5 * 60 * 1000) {
            return;
        }

        if (loading) return;

        set({ loading: true, error: null });

        try {
            const data = await notificationService.getRules();
            set({
                rules: data,
                loading: false,
                lastFetch: Date.now()
            });
        } catch (error) {
            console.error('[NotificationStore] ❌ Error fetching rules:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchHealth: async () => {
        set({ loadingHealth: true });
        try {
            const data = await notificationService.getHealth();
            set({ health: data, loadingHealth: false });
        } catch (error) {
            console.error('[NotificationStore] ❌ Error fetching health:', error);
            set({ loadingHealth: false });
        }
    },

    updateRule: async (notificationType, ruleData) => {
        try {
            const updatedRule = await notificationService.updateRule(notificationType, ruleData);
            set(state => ({
                rules: state.rules.map(rule =>
                    rule.notification_type === notificationType ? updatedRule : rule
                )
            }));
            return updatedRule;
        } catch (error) {
            console.error('[NotificationStore] ❌ Error updating rule:', error);
            throw error;
        }
    },

    // Operational Actions
    resetCircuit: async () => {
        try {
            await notificationService.resetCircuit();
            await get().fetchHealth();
        } catch (error) {
            console.error('[NotificationStore] ❌ Error resetting circuit:', error);
            throw error;
        }
    },

    triggerEvaluation: async () => {
        try {
            await notificationService.triggerEvaluation();
            await get().fetchHealth();
        } catch (error) {
            console.error('[NotificationStore] ❌ Error triggering evaluation:', error);
            throw error;
        }
    },

    triggerDelivery: async () => {
        try {
            await notificationService.triggerDelivery();
            await get().fetchHealth();
        } catch (error) {
            console.error('[NotificationStore] ❌ Error triggering delivery:', error);
            throw error;
        }
    },

    cleanupSubscriptions: async () => {
        try {
            const res = await notificationService.cleanupSubscriptions();
            await get().fetchHealth();
            return res;
        } catch (error) {
            console.error('[NotificationStore] ❌ Error cleaning subscriptions:', error);
            throw error;
        }
    },

    // Get rules by type
    getRulesByType: (types) => {
        const { rules } = get();
        const filtered = rules.filter(rule => types.includes(rule.notification_type));
        return filtered;
    },

    // Clear cache (force refetch on next load)
    clearCache: () => {
        set({ lastFetch: null });
    }
}));

export default useNotificationStore;
