import { create } from 'zustand'
import { appointmentService } from '../services/appointmentService'

export const useAppointmentStore = create((set, get) => ({
    appointments: [],
    loading: false,
    error: null,
    lastFetched: null,

    fetchAppointments: async (force = false) => {
        const { lastFetched, loading } = get()

        // Simple cache strategy: if fetched less than 5 minutes ago and not forced, return
        const fiveMinutes = 5 * 60 * 1000
        if (!force && lastFetched && (Date.now() - lastFetched < fiveMinutes) && !loading) {
            return
        }

        set({ loading: true, error: null })
        try {
            const data = await appointmentService.getAppointments()
            set({
                appointments: data,
                loading: false,
                lastFetched: Date.now()
            })
        } catch (error) {
            console.error("Error fetching appointments:", error)
            set({
                error: error.message || 'Failed to fetch appointments',
                loading: false
            })
        }
    },

    // Helper to invalidate cache (e.g., after creating a new appointment)
    invalidateCache: () => {
        set({ lastFetched: null })
    },

    // Direct state update if needed (optimistic updates)
    setAppointments: (appointments) => {
        set({ appointments, lastFetched: Date.now() })
    }
}))
