/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#bfbfff',
          500: '#3b3bf5',
          600: '#0404e2',
          700: '#0303b5',
          800: '#02028a',
        }
      }
    },
  },
  plugins: [],
}

