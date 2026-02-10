import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar, History } from 'lucide-react';
import CycleSymptomsTab from '../../components/cycle-predictor/CycleSymptomsTab';
import CycleHistoryTab from '../../components/cycle-predictor/CycleHistoryTab';
import CycleCalendarTab from '../../components/cycle-predictor/CycleCalendarTab';

/**
 * CycleLogsPage - Combined view for symptoms logging and history
 * Includes full calendar view option
 */
export default function CycleLogsPage() {
    const [activeTab, setActiveTab] = useState('symptoms');

    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    📝 Registros
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Síntomas, calendario e historial de ciclos
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="symptoms" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Síntomas</span>
                        <span className="sm:hidden">Hoy</span>
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Calendario</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span>Historial</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="symptoms" className="mt-0">
                    <CycleSymptomsTab />
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                    <CycleCalendarTab />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <CycleHistoryTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
