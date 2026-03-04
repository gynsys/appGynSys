import { create } from 'zustand';
import notificationService from '../services/notificationService';

const useNotificationStore = create((set, get) => ({
    rules: [],
    loading: false,
    error: null,
    lastFetch: null,

    // Fetch all notification rules
    fetchRules: async (force = false) => {
        const { lastFetch, loading, rules } = get();



        // Don't refetch if we already have data and it's less than 5 minutes old
        if (!force && lastFetch && Date.now() - lastFetch < 5 * 60 * 1000) {
            return;
        }

        // Don't fetch if already loading
        if (loading) {
            return;
        }

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
