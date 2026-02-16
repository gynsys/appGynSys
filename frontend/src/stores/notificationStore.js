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

        console.log('[NotificationStore] 🔵 fetchRules called', {
            force,
            hasCache: !!lastFetch,
            isLoading: loading,
            currentRulesCount: rules.length
        });

        // Don't refetch if we already have data and it's less than 5 minutes old
        if (!force && lastFetch && Date.now() - lastFetch < 5 * 60 * 1000) {
            console.log('[NotificationStore] ⚠️ Using cached data (less than 5min old)');
            return;
        }

        // Don't fetch if already loading
        if (loading) {
            console.log('[NotificationStore] ⚠️ Already loading, skipping...');
            return;
        }

        console.log('[NotificationStore] 🔵 Setting loading=true');
        set({ loading: true, error: null });

        try {
            const data = await notificationService.getRules();
            console.log('[NotificationStore] ✅ Data received from service:', {
                count: data?.length || 0,
                sample: data?.[0]
            });

            set({
                rules: data,
                loading: false,
                lastFetch: Date.now()
            });

            console.log('[NotificationStore] ✅ Store updated successfully', {
                rulesCount: data?.length || 0,
                loading: false
            });
        } catch (error) {
            console.error('[NotificationStore] ❌ Error fetching rules:', error);
            set({ error: error.message, loading: false });
        }
    },

    // Update a rule by notification_type
    updateRule: async (notificationType, ruleData) => {
        console.log('[NotificationStore] 🔵 Updating rule:', notificationType);
        try {
            const updatedRule = await notificationService.updateRule(notificationType, ruleData);
            set(state => ({
                rules: state.rules.map(rule =>
                    rule.notification_type === notificationType ? updatedRule : rule
                )
            }));
            console.log('[NotificationStore] ✅ Rule updated in store');
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
        console.log('[NotificationStore] 🔍 getRulesByType:', { types, found: filtered.length });
        return filtered;
    },

    // Clear cache (force refetch on next load)
    clearCache: () => {
        console.log('[NotificationStore] 🔄 Cache cleared');
        set({ lastFetch: null });
    }
}));

export default useNotificationStore;
