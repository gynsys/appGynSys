import { useState, useEffect } from 'react'
import { getImageUrl } from '../../lib/imageUtils'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

const QUESTIONS = [
  "¿Experimentas dolor pélvico intenso durante la menstruación que interfiere con tus actividades diarias?",
  "¿Tienes dolor durante o después de las relaciones sexuales?",
  "¿Sufres de dolor al orinar o al defecar, especialmente durante la menstruación?",
  "¿Has sido diagnosticada previamente con infertilidad o tienes dificultades para concebir?",
  "¿Experimentas fatiga crónica o falta de energía sin una causa aparente?",
  "¿Tienes problemas digestivos como hinchazón, estreñimiento o diarrea, especialmente durante la menstruación?",
  "¿Experimentas sangrado menstrual abundante o irregular?",
  "¿Sientes dolor en la parte baja de la espalda o en las piernas durante la menstruación?",
  "¿Has sido diagnosticada con quistes ováricos o masas pélvicas?",
  "¿Tienes antecedentes familiares de endometriosis (madre, tía, hermana)?"
]

import { testService } from '../../services/testService'

export default function EndometriosisTestModal({
  isOpen,
  onClose,
  doctorId, // New prop
  primaryColor = '#4F46E5',
  doctorName = 'tu doctora',
  doctorPhoto = null,

  isDarkMode = false,
  onSchedule = null,
  onCycle = null
}) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([]) // Array of booleans (true=Yes, false=No)
  const [showResult, setShowResult] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false) // New state for calculation delay
  const [direction, setDirection] = useState(1) // +1 for next, -1 for prev (if we added back button)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowWelcome(true)
      setCurrentQuestion(0)
      setAnswers([])
      setShowResult(false)
    }
  }, [isOpen])

  const handleAnswer = (isYes) => {
    setDirection(1)
    const newAnswers = [...answers, isYes]
    setAnswers(newAnswers)

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setIsAnalyzing(true)
      setTimeout(async () => {
        setIsAnalyzing(false)
        setShowResult(true)

        // Calculate result and save to backend
        try {
          const score = [...newAnswers].filter(a => a).length
          const total = QUESTIONS.length
          const percentage = (score / total) * 100
          let nivel = "BAJA COINCIDENCIA"
          if (percentage >= 70) nivel = "ALTA COINCIDENCIA"
          else if (percentage >= 40) nivel = "MODERADA COINCIDENCIA"

          // We need doctor_id. If not passed directly (it isn't), we might need to rely on identifying the doctor from context.
          // Actually, the modal receives `doctorName` but not `doctorId`.
          // Wait, this modal is used on public profile. We need to know WHICH doctor owns this test.
          // The modal is usually rendered in `DoctorProfilePage`, inside `EndometriosisTestModal`.
          // User needs to pass `doctorId` prop to `EndometriosisTestModal`.
          // I will assume `doctorId` prop is added. If not, I need to add it to usage in DoctorProfilePage too.
          // For now, I'll add `doctorId` to props and usage here.

          if (doctorId) {
            await testService.saveEndometriosisResult({
              doctor_id: doctorId,
              score,
              total_questions: total,
              result_level: nivel,
              patient_identifier: "Anonymous" // or enhanced later
            });
          }
        } catch (err) {
          console.error("Error saving test result", err)
        }
      }, 2000) // 2 second delay for "calculation" effect
    }
  }

  const getResult = () => {
    const score = answers.filter(a => a).length
    const total = QUESTIONS.length
    const percentage = (score / total) * 100

    let nivel, recomendacion, colorClass, colorHex

    if (percentage >= 70) {
      nivel = "ALTA COINCIDENCIA"
      recomendacion = "Es crucial que busques una evaluación especializada."
      colorClass = "text-red-600 dark:text-red-400"
      colorHex = "#DC2626"
    } else if (percentage >= 40) {
      nivel = "MODERADA COINCIDENCIA"
      recomendacion = "Considera una consulta ginecológica para recibir orientación."
      colorClass = "text-orange-500 dark:text-orange-400"
      colorHex = "#F97316"
    } else {
      nivel = "BAJA COINCIDENCIA"
      recomendacion = "Si tienes molestias, habla con un médico para explorar otras causas."
      colorClass = "text-green-600 dark:text-green-400"
      colorHex = "#16A34A"
    }

    return { score, total, percentage, nivel, recomendacion, colorClass, colorHex }
  }

  const handleClose = () => {
    onClose()
  }

  const result = showResult ? getResult() : null
  const progressPercentage = ((currentQuestion) / QUESTIONS.length) * 100

  // Variants for question transition
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 }
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    })
  }

  const bgClass = isDarkMode ? "bg-gray-800" : "bg-white"
  const textClass = isDarkMode ? "text-white" : "text-gray-900"
  const subTextClass = isDarkMode ? "text-gray-300" : "text-gray-600"
  const borderClass = isDarkMode ? "border-gray-700" : "border-gray-200"

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">

            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm"
              aria-hidden="true"
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Panel - Clicking outside (on the wrapper div above) doesn't close automatically unless we add overlay click handler, but usually better UX to have explicit close.
                If we want click-outside-to-close, we'd add onClick={handleClose} to the overlay motion.div above.
             */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 40 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              className={`inline-block align-bottom ${bgClass} rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ring-1 ring-white/10`}
            >
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative ${bgClass}`}>
                <button
                  onClick={handleClose}
                  className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'} rounded-full p-1 transition-colors z-10`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                <AnimatePresence mode="wait">
                  {showWelcome ? (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-6"
                    >
                      <div className="mb-6 inline-block relative">
                        {doctorPhoto ? (
                          <img
                            src={getImageUrl(doctorPhoto)}
                            alt={doctorName}
                            className={`w-28 h-28 rounded-full object-cover shadow-xl border-4 ${isDarkMode ? 'border-gray-700' : 'border-indigo-50'}`}
                          />
                        ) : (
                          <div className={`p-5 rounded-full ${isDarkMode ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <h3 className={`text-2xl font-bold ${textClass} mb-2`}>
                        ¡Hola! Soy {doctorName}
                      </h3>
                      <p className={`text-lg ${subTextClass} mb-6`}>
                        Bienvenida 👋
                      </p>

                      <p className={`${subTextClass} mb-8 max-w-sm mx-auto leading-relaxed`}>
                        Te invito a realizar este breve <strong>Test de Endometriosis</strong>.
                        Responder estas preguntas te ayudará a identificar posibles síntomas y te dará una recomendación personalizada.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                        <button
                          onClick={handleClose}
                          className={`px-6 py-3 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-xl font-medium transition-colors w-full sm:w-auto`}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => setShowWelcome(false)}
                          className="px-8 py-3 text-white rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 w-full sm:w-auto hover:brightness-110"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Iniciar Test
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="test"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="w-full"
                    >
                      <h3 className={`text-xl leading-6 font-bold ${textClass} mb-6 pr-8`} id="modal-title">
                        Test de Endometriosis
                      </h3>

                      {/* Dynamic Progress Bar (Segmented & Colored) */}
                      {!showResult && (
                        <div className="mb-8">
                          <div className={`flex justify-between text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                            <span>Progreso</span>
                            <span>{Math.round(progressPercentage)}%</span>
                          </div>

                          {/* Segmented Container */}
                          <div className="flex h-3 w-full gap-1">
                            {QUESTIONS.map((_, index) => {
                              return (
                                <motion.div
                                  key={index}
                                  initial={{ scaleX: 0.8, opacity: 0 }}
                                  animate={{
                                    scaleX: 1,
                                    opacity: 1,
                                    backgroundColor: index < answers.length
                                      ? (answers[index] ? "#EF4444" : "#22C55E") // Red-500 / Green-500
                                      : (index === currentQuestion ? "#60A5FA" : (isDarkMode ? "#374151" : "#F3F4F6"))
                                  }}
                                  transition={{ duration: 0.3 }}
                                  className="h-full flex-1 rounded-full first:rounded-l-full last:rounded-r-full shadow-sm"
                                />
                              );
                            })}
                          </div>

                          <div className="text-right mt-1">
                            <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Pregunta {currentQuestion + 1} de {QUESTIONS.length}</span>
                          </div>
                        </div>
                      )}

                      {/* Content Area */}
                      <div className="mt-2 min-h-[200px] flex flex-col justify-center">
                        <AnimatePresence mode="wait" custom={direction}>
                          {!showResult && !isAnalyzing ? (
                            <motion.div
                              key={currentQuestion}
                              custom={direction}
                              variants={variants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              className="w-full"
                            >
                              <p className={`text-xl ${textClass} font-medium mb-10 text-center leading-relaxed`}>
                                {QUESTIONS[currentQuestion]}
                              </p>

                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, duration: 0.5 }}
                                className="flex gap-4 justify-center"
                              >
                                <motion.button
                                  whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(34, 197, 94, 0.3)" }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAnswer(false)}
                                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-semibold shadow-md w-36"
                                >
                                  No
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(244, 63, 94, 0.3)" }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAnswer(true)}
                                  className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all font-semibold shadow-md w-36"
                                >
                                  Sí
                                </motion.button>
                              </motion.div>
                            </motion.div>
                          ) : isAnalyzing ? (
                            <motion.div
                              key="analyzing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-center py-10"
                            >
                              <div className="flex justify-center mb-4">
                                <svg className={`animate-spin h-12 w-12 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                              <p className={`text-lg font-medium ${textClass} animate-pulse`}>
                                Analizando tus respuestas...
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="result"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5, type: "spring" }}
                              className="text-center py-4"
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg"
                                style={{ backgroundColor: result.colorHex }}
                              >
                                {Math.round(result.percentage)}%
                              </motion.div>

                              <h4 className={`text-2xl font-black mb-3 ${result.colorClass}`}>
                                {result.nivel}
                              </h4>

                              <p className={`${subTextClass} mb-8 text-lg leading-relaxed px-4`}>
                                {result.recomendacion}
                              </p>

                              <div className="space-y-3 px-4 sm:px-8">
                                {/* Primary Action: Schedule Appointment */}
                                {onSchedule && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      handleClose()
                                      onSchedule()
                                    }}
                                    className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-4 text-white text-lg font-bold focus:outline-none transition-all hover:brightness-110"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Agendar cita ahora
                                  </motion.button>
                                )}

                                {/* Secondary Action: Cycle Predictor */}
                                {onCycle && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      handleClose()
                                      onCycle()
                                    }}
                                    className={`w-full inline-flex justify-center items-center rounded-xl border-2 px-5 py-2.5 font-bold focus:outline-none transition-all ${isDarkMode ? 'border-gray-600 hover:border-gray-500 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                                    style={!isDarkMode ? { color: primaryColor, borderColor: primaryColor } : {}}
                                  >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                                    Ver Calculadora Menstrual
                                  </motion.button>
                                )}

                                {/* Tertiary Action: Close */}
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleClose}
                                  className={`w-full inline-flex justify-center rounded-xl px-4 py-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} text-sm font-medium focus:outline-none transition-colors mt-2`}
                                >
                                  Entendido, ya lo tengo claro
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div >
      )
      }
    </AnimatePresence >
  )
}
