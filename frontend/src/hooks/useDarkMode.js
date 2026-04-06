import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      // Solo usar lo que el inquilino configuró (grabado en localStorage por DoctorProfilePage).
      // NUNCA usar prefers-color-scheme del sistema: el tema del doctor manda.
      return localStorage.getItem('theme_preference') === 'dark'
    }
    return false
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme_preference', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme_preference', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return [darkMode, toggleDarkMode]
}
