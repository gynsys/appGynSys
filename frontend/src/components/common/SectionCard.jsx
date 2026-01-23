import React from 'react'
import { getThemeClasses } from '../../lib/profileThemes'

/**
 * SectionCard Component
 * Wraps section content in a premium "Floating Glass" card style.
 * 
 * @param {string} id - Section ID for navigation anchors
 * @param {string} className - Additional classes for the section
 * @param {string} containerBgColor - Custom background color/gradient
 * @param {string} scrollMargin - Scroll margin class (e.g., 'scroll-mt-32')
 * @param {ReactNode} children - Content inside the card
 * @param {string} theme - Design theme ('glass', 'minimal', 'soft', 'dark')
 */
export default function SectionCard({
    id,
    className = '',
    containerBgColor,
    scrollMargin = 'scroll-mt-24',
    children,
    title,
    theme = 'glass'
}) {
    const themeConfig = getThemeClasses(theme)
    const isGlass = themeConfig.id === 'glass'

    // Default gradient only for Glass theme if no custom color is provided
    const defaultGlassBg = 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.7) 100%)'

    const backgroundStyle = containerBgColor
        ? containerBgColor
        : (isGlass ? defaultGlassBg : undefined)

    return (
        <section id={id} className={`mb-20 ${scrollMargin} ${className}`}>
            <div
                className={`
            w-full relative overflow-hidden transition-all duration-500
            p-8 md:p-12
            ${themeConfig.container}
        `}
                style={{
                    background: backgroundStyle
                }}
            >
                {/* Background Decorators (Subtle Orbs) - Only for Glass & Neon for Dark */}
                {themeConfig.decorator === 'glass' && (
                    <>
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10" />
                    </>
                )}

                {themeConfig.decorator === 'neon' && (
                    <>
                        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-indigo-500 to-transparent opacity-50" />
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
                    </>
                )}

                {themeConfig.decorator === 'soft' && (
                    <>
                        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-100/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-100/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    </>
                )}

                {/* Optional Title within component to ensure consistent styling */}
                {title && (
                    <h2 className={`text-3xl md:text-4xl text-gray-900 dark:text-white mb-10 text-center relative z-10 ${themeConfig.title || 'font-bold'}`}>
                        {title}
                    </h2>
                )}

                {children}
            </div>
        </section>
    )
}
