import React from 'react'

export default function ToggleSwitch({ checked, onChange, color = 'pink' }) {
    const bgClass = checked
        ? (color === 'blue' ? 'bg-blue-600' : 'bg-pink-600')
        : 'bg-gray-200 dark:bg-gray-700'

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange && onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${bgClass}`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    )
}
