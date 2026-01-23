export const PROFILE_THEMES = {
    glass: {
        id: 'glass',
        name: 'Glass Premium',
        container: 'backdrop-blur-xl bg-white/40 dark:bg-gray-900/60 border border-white/40 dark:border-gray-700 shadow-2xl rounded-[2rem]',
        button: 'shadow-lg hover:shadow-xl transform hover:scale-105',
        title: 'font-bold tracking-tight',
        decorator: 'glass' // Logic for gradient orbs
    },
    minimal: {
        id: 'minimal',
        name: 'Consultorio Clínico',
        container: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl',
        button: 'shadow-none border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
        title: 'font-semibold tracking-normal uppercase text-sm text-gray-500 mb-4',
        decorator: 'none'
    },
    soft: {
        id: 'soft',
        name: 'Soft & Care',
        container: 'bg-white/90 dark:bg-gray-800/90 shadow-xl shadow-indigo-100/50 dark:shadow-none border-none rounded-[3rem]',
        button: 'rounded-full shadow-md hover:shadow-lg',
        title: 'font-medium tracking-wide',
        decorator: 'soft' // Maybe pastel circles
    },
    dark: {
        id: 'dark',
        name: 'Executive Dark',
        container: 'bg-gray-950 border border-gray-800 shadow-2xl shadow-black/50 rounded-2xl',
        button: 'border border-gray-700 hover:border-gray-500 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]',
        title: 'font-bold tracking-tighter uppercase',
        decorator: 'neon'
    }
}

export const getThemeClasses = (themeId) => {
    return PROFILE_THEMES[themeId] || PROFILE_THEMES.glass
}
