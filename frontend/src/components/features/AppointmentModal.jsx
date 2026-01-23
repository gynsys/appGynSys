import { Fragment } from 'react'
import { Transition } from '@headlessui/react'
import { MdClose } from 'react-icons/md'
import ChatBooking from './ChatBooking'

export default function AppointmentModal({ isOpen, onClose, doctorId, doctor, primaryColor = '#4F46E5' }) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <div className="relative z-50">
        {/* No backdrop for widget feel, allows interaction with page if needed, or maybe transparent backdrop to catch clicks for close? 
            User wants "widget", usually no backdrop. But let's keep it simple. 
            If I don't have a backdrop, clicks outside won't close it automatically unless I use a listener. 
            For now, manual close button is fine. */}

        <Transition.Child
          as={Fragment}
          enter="transform transition duration-300 ease-in-out"
          enterFrom="translate-y-10 opacity-0 scale-95"
          enterTo="translate-y-0 opacity-100 scale-100"
          leave="transform transition duration-200 ease-in-out"
          leaveFrom="translate-y-0 opacity-100 scale-100"
          leaveTo="translate-y-10 opacity-0 scale-95"
        >
          <div
            className="fixed bottom-0 left-0 right-0 w-full md:w-[360px] md:bottom-24 md:right-8 md:left-auto bg-white dark:bg-gray-800 rounded-t-2xl rounded-b-none md:rounded-2xl shadow-2xl border-t-2 md:border-2 border-x-0 border-b-0 md:border-x-2 md:border-b-2 overflow-hidden flex flex-col"
            style={{ borderColor: `${primaryColor}33` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">Agendar Cita</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                <MdClose className="text-gray-500" />
              </button>
            </div>
            {/* Body */}
            <ChatBooking doctorId={doctorId} doctor={doctor} onClose={onClose} />
          </div>
        </Transition.Child>
      </div>
    </Transition>
  )
}
