import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar, History } from 'lucide-react';
import CycleSymptomsTab from '../../components/cycle-predictor/CycleSymptomsTab';
import CycleHistoryTab from '../../components/cycle-predictor/CycleHistoryTab';
import CycleCalendarTab from '../../components/cycle-predictor/CycleCalendarTab';
import cycleService from '../../services/cycleService';
import { useAuthStore } from '../../store/authStore';

/**
 * CycleLogsPage - Combined view for symptoms logging and history
 * Includes full calendar view option
 */
export default function CycleLogsPage() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'symptoms');
    const [activePregnancy, setActivePregnancy] = useState(null);
    const { isCycleAuthenticated } = useAuthStore();
    const tenantPrimaryColor = localStorage.getItem('tenant_theme_primary') || '#ec4899';

    const getTabStyle = (tabName) => {
        return activeTab === tabName 
            ? { backgroundColor: `${tenantPrimaryColor}20`, color: tenantPrimaryColor }
            : {};
    };

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state?.tab]);

    useEffect(() => {
        if (isCycleAuthenticated) {
            cycleService.getActivePregnancy()
                .then(preg => setActivePregnancy(preg))
                .catch(e => console.error(e));
        }
    }, [isCycleAuthenticated]);

    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    📝 Registros
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activePregnancy ? 'Síntomas e historial prenatal' : 'Síntomas, calendario e historial de ciclos'}
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="symptoms" className="flex items-center gap-2 transition-all duration-300" style={getTabStyle('symptoms')}>
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Síntomas</span>
                        <span className="sm:hidden">Hoy</span>
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2 transition-all duration-300" style={getTabStyle('calendar')}>
                        <Calendar className="w-4 h-4" />
                        <span>Calendario</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2 transition-all duration-300" style={getTabStyle('history')}>
                        <History className="w-4 h-4" />
                        <span>Historial</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="symptoms" className="mt-0">
                    <CycleSymptomsTab activePregnancy={activePregnancy} />
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                    <CycleCalendarTab activePregnancy={activePregnancy} />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <CycleHistoryTab activePregnancy={activePregnancy} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
