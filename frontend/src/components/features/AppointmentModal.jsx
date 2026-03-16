import { Fragment } from 'react'
import { Transition } from '@headlessui/react'
import { MdClose } from 'react-icons/md'
import { isCapacitor } from '../../utils/platform'
import ChatBooking from './ChatBooking'

export default function AppointmentModal({ isOpen, onClose, doctorId, doctor, primaryColor = '#4F46E5' }) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <div className="relative z-[100]">
        {/* Backdrop logic for mobile feel and depth */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-800 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-400 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed md:bottom-24 left-0 right-0 w-full md:w-[360px] h-[80vh] md:h-auto md:max-h-[600px] md:right-8 md:left-auto bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl shadow-2xl border-t-2 md:border-2 border-x-0 border-b-0 md:border-x-2 md:border-b-2 overflow-hidden flex flex-col transition-all duration-300 bottom-nav-safe origin-center sm:origin-bottom-right"
            style={{ 
              borderColor: `${primaryColor}33`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 z-10 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">Agendar Cita</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                <MdClose className="text-gray-500" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col pt-2">
              <ChatBooking doctorId={doctorId} doctor={doctor} onClose={onClose} />
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  )
}
