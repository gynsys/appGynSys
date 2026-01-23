import { useEffect, useState } from 'react'
import { useToastStore } from '../../store/toastStore'

const Toast = ({ id, message, type, duration }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const removeToast = useToastStore((state) => state.removeToast)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      removeToast(id)
    }, 300) // Match animation duration
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-200',
          border: 'border-green-500',
          text: 'text-green-900',
          icon: 'text-green-600',
          button: 'text-green-700 hover:text-green-900',
        }
      case 'error':
        return {
          bg: 'bg-red-200',
          border: 'border-red-500',
          text: 'text-red-900',
          icon: 'text-red-600',
          button: 'text-red-700 hover:text-red-900',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-200',
          border: 'border-yellow-500',
          text: 'text-yellow-900',
          icon: 'text-yellow-600',
          button: 'text-yellow-700 hover:text-yellow-900',
        }
      default:
        return {
          bg: 'bg-blue-200',
          border: 'border-blue-500',
          text: 'text-blue-900',
          icon: 'text-blue-600',
          button: 'text-blue-700 hover:text-blue-900',
        }
    }
  }

  const styles = getStyles()

  return (
    <div
      className={`
        flex items-start space-x-3 px-4 py-3 rounded-lg shadow-lg border
        ${styles.bg} ${styles.border} ${styles.text}
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        ${isLeaving ? 'translate-y-2 opacity-0 scale-95' : ''}
        min-w-[300px] max-w-md
      `}
      style={{ borderWidth: '1px' }}
      role="alert"
    >
      <div className={`flex-shrink-0 ${styles.icon}`}>
        {getIcon()}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium leading-5">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ${styles.button} transition-colors`}
        aria-label="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
      <div className="flex flex-col items-center space-y-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  )
}

