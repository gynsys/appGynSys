import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Calendar, Heart, History, User, LogIn, LogOut, Settings, Baby } from 'lucide-react'
import CycleDashboardTab from './CycleDashboardTab'
import CycleCalendarTab from './CycleCalendarTab'
import CycleSymptomsTab from './CycleSymptomsTab'
import CycleHistoryTab from './CycleHistoryTab'
import CycleAuthDialog from './CycleAuthDialog'
import CycleSettingsTab from './CycleSettingsTab'
import PregnancyDashboard from './PregnancyDashboard'
import Button from '../common/Button'
import { useAuthStore } from '../../store/authStore'
import cycleService from '../../services/cycleService'
import { useDarkMode } from '../../hooks/useDarkMode'
import { cn } from '../../lib/utils'

export default function CyclePredictorModal({ open, onOpenChange, isDarkMode: propIsDarkMode }) {
    const [activeTab, setActiveTab] = useState('dashboard')
    const { user, logout, isAuthenticated } = useAuthStore()
    const [showLoginDialog, setShowLoginDialog] = useState(false)

    // New State
    const [activePregnancy, setActivePregnancy] = useState(null)
    const [loading, setLoading] = useState(true)

    const [authInitialView, setAuthInitialView] = useState('register')

    const [hookIsDarkMode] = useDarkMode()
    // Prioritize prop if strictly boolean (defined), otherwise use hook
    const isDarkMode = typeof propIsDarkMode === 'boolean' ? propIsDarkMode : hookIsDarkMode

    useEffect(() => {
        if (open && isAuthenticated) {
            checkPregnancyatus()
        }
    }, [open, isAuthenticated])

    const checkPregnancyatus = async () => {
        try {
            const preg = await cycleService.getActivePregnancy()
            setActivePregnancy(preg)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleLoginClick = () => {
        setAuthInitialView('login')
        setShowLoginDialog(true)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700 [&>button]:top-2", isDarkMode && "dark")}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                    <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b dark:border-gray-700 shrink-0 relative px-6 md:px-0">
                        <DialogTitle className="sr-only">Predictor de Ciclo y Embarazo</DialogTitle>
                        {/* 1. Tabs List OR Pregnancy Title (Centered) */}
                        <div className="flex-1 flex justify-center">
                            <TabsList className="flex p-0 bg-transparent gap-2 md:gap-6 h-auto">
                                <TabsTrigger
                                    value="dashboard"
                                    className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 md:data-[state=active]:bg-gray-100 md:dark:data-[state=active]:bg-gray-800 font-medium text-sm px-2 md:px-4 py-2 rounded-full transition-all hover:text-pink-500"
                                >
                                    {activePregnancy ? <Baby className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
                                    <span className="hidden sm:inline">Inicio</span>
                                </TabsTrigger>

                                {!activePregnancy && (
                                    <TabsTrigger
                                        value="calendar"
                                        className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 md:data-[state=active]:bg-gray-100 md:dark:data-[state=active]:bg-gray-800 font-medium text-sm px-2 md:px-4 py-2 rounded-full transition-all hover:text-pink-500"
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Calendario</span>
                                    </TabsTrigger>
                                )}

                                <TabsTrigger
                                    value="symptoms"
                                    className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 md:data-[state=active]:bg-gray-100 md:dark:data-[state=active]:bg-gray-800 font-medium text-sm px-2 md:px-4 py-2 rounded-full transition-all hover:text-pink-500"
                                >
                                    <Heart className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Síntomas</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 md:data-[state=active]:bg-gray-100 md:dark:data-[state=active]:bg-gray-800 font-medium text-sm px-2 md:px-4 py-2 rounded-full transition-all hover:text-pink-500"
                                >
                                    <History className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Historial</span>
                                </TabsTrigger>
                                {isAuthenticated && user && (
                                    <TabsTrigger
                                        value="settings"
                                        className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 md:data-[state=active]:bg-gray-100 md:dark:data-[state=active]:bg-gray-800 font-medium text-sm px-2 md:px-4 py-2 rounded-full transition-all hover:text-pink-500"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Notificaciones</span>
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        {/* 2. Profile / Login (Right Aligned in Header) */}
                        <div className="flex-none z-20">
                            {isAuthenticated && user ? (
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors text-red-600 dark:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full text-xs h-8 gap-2 border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800 dark:bg-gray-900 dark:text-pink-300 dark:border-pink-800 dark:hover:bg-pink-900/40 whitespace-nowrap"
                                    onClick={handleLoginClick}
                                >
                                    <LogIn className="w-3 h-3" />
                                    <span className="hidden sm:inline">Login</span>
                                </Button>
                            )}
                        </div>

                        <DialogDescription className="sr-only">
                            Control del ciclo menstrual y embarazo.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Content Area */}
                    <div className="mt-2 text-center">
                        <TabsContent value="dashboard" className="mt-0">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.6 }}
                            >
                                {activePregnancy ? (
                                    <PregnancyDashboard
                                        activePregnancy={activePregnancy}
                                        onStatusChange={checkPregnancyatus}
                                    />
                                ) : (
                                    <CycleDashboardTab onPregnancyChange={checkPregnancyatus} />
                                )}
                            </motion.div>
                        </TabsContent>

                        {!activePregnancy && (
                            <TabsContent value="calendar" className="mt-0">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <CycleCalendarTab onPregnancyChange={checkPregnancyatus} />
                                </motion.div>
                            </TabsContent>
                        )}

                        <TabsContent value="symptoms" className="mt-0">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.6 }}
                            >
                                <CycleSymptomsTab activePregnancy={activePregnancy} />
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.6 }}
                            >
                                <CycleHistoryTab />
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="settings" className="mt-0">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.6 }}
                            >
                                <CycleSettingsTab onPregnancyChange={checkPregnancyatus} />
                            </motion.div>
                        </TabsContent>
                    </div>
                </Tabs>

                <CycleAuthDialog
                    open={showLoginDialog}
                    onOpenChange={setShowLoginDialog}
                    initialView={authInitialView}
                />
            </DialogContent>
        </Dialog>
    )
}
