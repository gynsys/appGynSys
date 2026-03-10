import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useDarkMode } from '../../hooks/useDarkMode'

export default function Modal({ isOpen, onClose, title, children, size = 'md', darkMode = false, fullScreenOnMobile = false }) {
  const [isDarkMode] = useDarkMode()
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '4xl': 'max-w-7xl',
    '5xl': 'max-w-[90%]', // Custom extra wide
    full: 'max-w-[98%]',  // Almost full width
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className={`flex items-center justify-center text-center ${fullScreenOnMobile ? 'min-h-[100dvh] p-0 md:min-h-full md:p-4' : 'min-h-full p-4'}`}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <div className={(darkMode || isDarkMode) ? 'dark w-full flex justify-center' : 'w-full flex justify-center'}>
                <Dialog.Panel className={`w-full ${sizeClasses[size]} transform overflow-hidden bg-white dark:bg-gray-900 dark:text-white text-left align-middle shadow-xl transition-all border-gray-200 dark:border-gray-700 flex flex-col ${fullScreenOnMobile ? 'h-[100dvh] min-h-[100dvh] rounded-none border-0 px-2 pt-12 pb-4 md:h-auto md:min-h-0 md:max-h-[85vh] md:rounded-2xl md:border md:px-6 md:py-6' : 'max-h-[85vh] rounded-2xl border px-4 py-4 md:p-6'}`}>
                  <div className={`flex ${title ? 'justify-between items-center mb-4' : 'justify-end'}`}>
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-bold leading-6 text-gray-900 dark:text-white truncate pr-8"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className={`text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition outline-none border-none focus:outline-none absolute top-4 right-4 bg-white/50 dark:bg-black/50 p-1 rounded-full backdrop-blur-sm z-[80]`}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {children}
                </Dialog.Panel>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

