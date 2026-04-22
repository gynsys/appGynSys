/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["'Playfair Display'", 'serif'],
        manrope: ["'Manrope'", 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#bfbfff',
          500: '#3b3bf5',
          600: '#0404e2',
          700: '#0303b5',
          800: '#02028a',
        },
        indigo: {
          50: 'var(--color-indigo-50, #eef2ff)',
          100: 'var(--color-indigo-100, #e0e7ff)',
          200: 'var(--color-indigo-200, #c7d2fe)',
          300: 'var(--color-indigo-300, #a5b4fc)',
          400: 'var(--color-indigo-400, #818cf8)',
          500: 'var(--color-indigo-500, #6366f1)',
          600: 'var(--color-indigo-600, #4f46e5)',
          700: 'var(--color-indigo-700, #4338ca)',
          800: 'var(--color-indigo-800, #3730a3)',
          900: 'var(--color-indigo-900, #312e81)',
          950: 'var(--color-indigo-950, #1e1b4b)',
        }
      }
    },
  },
  plugins: [],
}

