import { useState, useEffect, useRef } from 'react'

/**
 * ScrollReveal Component
 * Wraps content and applies an animation when it enters the viewport.
 * 
 * @param {ReactNode} children - Content to animate
 * @param {string} variant - 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in'
 * @param {number} delay - Delay in seconds (e.g. 0.2)
 * @param {string} className - Additional classes
 */
export default function ScrollReveal({
    children,
    variant = 'fade-up',
    delay = 0,
    className = ''
}) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Replay Mode: Update state based on visibility
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )

        if (ref.current) observer.observe(ref.current)

        return () => observer.disconnect()
    }, [])

    const getBaseClasses = () => {
        return `transition-all duration-1000 ease-out transform ${className}`
    }

    const getVariantClasses = () => {
        // Hidden State
        if (!isVisible) {
            switch (variant) {
                case 'fade-up': return 'opacity-0 translate-y-12'
                case 'fade-in': return 'opacity-0'
                case 'slide-left': return 'opacity-0 -translate-x-12'
                case 'slide-right': return 'opacity-0 translate-x-12'
                case 'zoom-in': return 'opacity-0 scale-90'
                default: return 'opacity-0 translate-y-12'
            }
        }
        // Visible State
        return 'opacity-100 translate-x-0 translate-y-0 scale-100'
    }

    return (
        <div
            ref={ref}
            className={`${getBaseClasses()} ${getVariantClasses()}`}
            style={{ transitionDelay: `${delay}s` }}
        >
            {children}
        </div>
    )
}
