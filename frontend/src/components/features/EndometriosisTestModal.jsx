import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getImageUrl } from '../../lib/imageUtils'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useDarkMode } from '../../hooks/useDarkMode'
import EndometriosisStatsModal from './EndometriosisStatsModal'

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

  // isDarkMode prop now handled explicitly to respect parent theme
  isDarkMode: propIsDarkMode, // Renamed to avoid conflict with hook or local var
  onSchedule = null,
  onCycle = null
}) {
  const [hookIsDarkMode] = useDarkMode()
  // Prioritize prop if strictly boolean (defined), otherwise use hook
  const isDarkMode = typeof propIsDarkMode === 'boolean' ? propIsDarkMode : hookIsDarkMode

  const [showWelcome, setShowWelcome] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([]) // Array of booleans (true=Yes, false=No)
  const [showResult, setShowResult] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false) // New state for calculation delay
  const [direction, setDirection] = useState(1) // +1 for next, -1 for prev (if we added back button)
  const [mounted, setMounted] = useState(false)
  const [showStats, setShowStats] = useState(false) // Added missing state

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowWelcome(true)
      setCurrentQuestion(0)
      setAnswers([])
      setShowResult(false)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
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

  if (!mounted) return null

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] overflow-hidden sm:overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex flex-col sm:flex-row items-center justify-center min-h-screen text-center sm:block sm:p-0">

                {/* Background overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity backdrop-blur-sm"
                  aria-hidden="true"
                  onClick={handleClose}
                />

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Panel */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 100 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 100 }}
                  transition={{ duration: 0.4, ease: [0.19, 1.0, 0.22, 1.0] }} // specific spring ease
                  className={`inline-block align-bottom ${bgClass} sm:rounded-2xl text-left overflow-y-auto shadow-2xl transform transition-all 
                w-full h-[100dvh] sm:h-auto sm:my-8 sm:align-middle sm:max-w-lg 
                flex flex-col sm:block absolute inset-0 sm:relative sm:inset-auto ${isDarkMode ? 'dark' : ''}`}
                >
                  <div className={`flex-1 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative ${bgClass} flex flex-col justify-center sm:block`}>
                    <button
                      onClick={handleClose}
                      className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'} rounded-full p-2 transition-colors z-10`}
                    >
                      <XMarkIcon className="h-7 w-7" />
                    </button>

                    <AnimatePresence mode="wait">
                      {showWelcome ? (
                        <motion.div
                          key="welcome"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                          className="text-center py-6 flex flex-col items-center justify-center h-full sm:h-auto"
                        >
                          <div className="mb-6 inline-block relative">
                            {doctorPhoto ? (
                              <img
                                src={getImageUrl(doctorPhoto)}
                                alt={doctorName}
                                className={`w-32 h-32 rounded-full object-cover shadow-xl border-4 ${isDarkMode ? 'border-gray-700' : 'border-indigo-50'}`}
                              />
                            ) : (
                              <div className={`p-6 rounded-full ${isDarkMode ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <h3 className={`text-2xl md:text-3xl font-bold ${textClass} mb-3`}>
                            ¡Hola! Soy {doctorName}
                          </h3>
                          <p className={`text-xl ${subTextClass} mb-8`}>
                            Bienvenida 👋
                          </p>

                          <p className={`${subTextClass} mb-12 max-w-sm mx-auto leading-relaxed text-base md:text-lg`}>
                            Te invito a realizar este breve <strong>Test de Endometriosis</strong>.
                            Identifica posibles síntomas y obtén una recomendación personalizada.
                          </p>

                          <div className="flex flex-col w-full max-w-xs gap-3">
                            <button
                              onClick={() => setShowWelcome(false)}
                              className="px-8 py-4 text-white rounded-2xl font-bold shadow-lg text-lg w-full hover:brightness-110 active:scale-95 transition-all"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Iniciar Test
                            </button>

                            <button
                              onClick={() => setShowStats(true)}
                              className={`px-8 py-3 font-medium text-sm rounded-xl border transition-all hover:bg-opacity-50 ${isDarkMode ? 'border-gray-600 text-indigo-400 hover:bg-gray-800' : 'border-indigo-100 text-indigo-600 hover:bg-indigo-50'}`}
                            >
                              Ver Estadísticas
                            </button>

                            <button
                              onClick={handleClose}
                              className={`px-8 py-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium text-sm hover:underline`}
                            >
                              No, gracias
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="test"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="w-full h-full flex flex-col justify-center sm:justify-start"
                        >
                          <h3 className={`text-xl md:text-2xl leading-6 font-bold ${textClass} mb-8 text-center sm:text-left pt-8 sm:pt-0`} id="modal-title">
                            Test de Endometriosis
                          </h3>

                          {/* Dynamic Progress Bar (Segmented & Colored) */}
                          {!showResult && (
                            <div className="mb-8 w-full max-w-md mx-auto sm:mx-0">
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
                          <div className="mt-2 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                            <AnimatePresence mode="wait" custom={direction}>
                              {!showResult && !isAnalyzing ? (
                                <motion.div
                                  key={currentQuestion}
                                  custom={direction}
                                  variants={variants}
                                  initial="enter"
                                  animate="center"
                                  exit="exit"
                                  className="w-full flex flex-col items-center"
                                >
                                  <p className={`text-2xl md:text-3xl ${textClass} font-semibold mb-12 text-center leading-relaxed`}>
                                    {QUESTIONS[currentQuestion]}
                                  </p>

                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none"
                                  >
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleAnswer(false)}
                                      className="px-8 py-4 bg-emerald-500 text-white rounded-2xl transition-all font-bold shadow-md w-full sm:w-36 text-lg"
                                    >
                                      No
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleAnswer(true)}
                                      className="px-8 py-4 bg-rose-500 text-white rounded-2xl transition-all font-bold shadow-md w-full sm:w-36 text-lg"
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
                                  <div className="flex justify-center mb-6">
                                    <svg className={`animate-spin h-16 w-16 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                  <p className={`text-xl font-medium ${textClass} animate-pulse`}>
                                    Analizando tus respuestas...
                                  </p>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="result"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.5, type: "spring" }}
                                  className="text-center w-full"
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-xl ring-4 ring-white/20"
                                    style={{ backgroundColor: result.colorHex }}
                                  >
                                    {Math.round(result.percentage)}%
                                  </motion.div>

                                  <h4 className={`text-3xl font-black mb-4 ${result.colorClass}`}>
                                    {result.nivel}
                                  </h4>

                                  <p className={`${subTextClass} mb-12 text-lg leading-relaxed px-2`}>
                                    {result.recomendacion}
                                  </p>

                                  <div className="space-y-4 w-full max-w-sm mx-auto">
                                    {/* Primary Action: Schedule Appointment */}
                                    {onSchedule && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                          handleClose()
                                          onSchedule()
                                        }}
                                        className="w-full inline-flex justify-center items-center rounded-2xl shadow-lg px-6 py-4 text-white text-lg font-bold focus:outline-none transition-all hover:brightness-110"
                                        style={{ backgroundColor: primaryColor }}
                                      >
                                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
                                        className={`w-full inline-flex justify-center items-center rounded-2xl border-2 px-5 py-4 font-bold focus:outline-none transition-all ${isDarkMode ? 'border-gray-600 hover:border-gray-500 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                                        style={!isDarkMode ? { color: primaryColor, borderColor: primaryColor } : {}}
                                      >
                                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                                        Ver Calculadora Menstrual
                                      </motion.button>
                                    )}

                                    {/* Tertiary Action: Close */}
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={handleClose}
                                      className={`w-full inline-flex justify-center rounded-xl px-4 py-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} text-sm font-medium focus:outline-none transition-colors mt-4`}
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
        </AnimatePresence >,
        document.body
      )}
      {showStats && <EndometriosisStatsModal isOpen={showStats} onClose={() => setShowStats(false)} isDarkMode={isDarkMode} />}
    </>
  )
}
