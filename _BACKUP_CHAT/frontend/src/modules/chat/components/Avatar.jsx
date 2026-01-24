import React from 'react';

/**
 * Avatar component that displays user initials in a colored circle
 * @param {string} name - User's full name
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 */
const Avatar = ({ name = 'Usuario', size = 'md' }) => {
    // Extract initials from name (first letter of first and last name)
    const getInitials = (fullName) => {
        if (!fullName) return 'U';
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Generate consistent color from name
    const getColorFromName = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const colors = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500',
            'bg-orange-500',
            'bg-cyan-500',
            'bg-emerald-500'
        ];

        return colors[Math.abs(hash) % colors.length];
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    const initials = getInitials(name);
    const bgColor = getColorFromName(name);

    return (
        <div className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
            {initials}
        </div>
    );
};

export default Avatar;
