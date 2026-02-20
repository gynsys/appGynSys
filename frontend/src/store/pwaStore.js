import { create } from 'zustand';

const usePWAStore = create((set) => ({
    deferredPrompt: null,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone,
    installable: false,

    setDeferredPrompt: (prompt) => set({
        deferredPrompt: prompt,
        installable: !!prompt
    }),

    setStandalone: (status) => set({ isStandalone: status }),
}));

export default usePWAStore;
