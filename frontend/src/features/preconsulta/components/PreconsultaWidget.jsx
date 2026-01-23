
import React, { useEffect, useState } from 'react';
import PreconsultaUI from './PreconsultaUI';
import { preconsultationService } from '../../../services/preconsultationService';
import jsonDataFlow from '../data/personal_info_flow.json';

// Helper to infer key from text
const inferSaveToKey = (text = '') => {
    // ... (Keep existing implementation logic) ...
    // Note: To avoid code duplication, this ideally should be in a utility file
    // But for safety and to match user request of "separating", I will include it here or move it.
    // Moving it to a utility is best practice.
    // For now, I will inline it to ensure I don't break logic.
    const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes('nombre completo')) return 'full_name';
    if (t.includes('cedula') || t.includes('dni')) return 'ci';
    if (t.includes('telefono')) return 'phone';
    if (t.includes('motivo')) return 'reason_for_visit';
    if (t.includes('edad') && !t.includes('gestacion')) return 'age';
    if (t.includes('direccion')) return 'address';
    if (t.includes('ocupacion')) return 'occupation';
    if (t.includes('email') || t.includes('correo')) return 'email';
    if (t.includes('madre') && (t.includes('historia') || t.includes('antecedente'))) return 'family_history_mother';
    if (t.includes('padre') && (t.includes('historia') || t.includes('antecedente'))) return 'family_history_father';
    if (t.includes('personal') && (t.includes('historia') || t.includes('antecedente'))) return 'personal_history';
    if (t.includes('suplemento')) return 'supplements';
    if (t.includes('quirurgico') || t.includes('cirugia')) return 'surgical_history';
    if (t.includes('menarquia') || t.includes('primera menstruacion')) return 'gyn_menarche';
    if (t.includes('sexarca') || t.includes('primera relacion')) return 'gyn_sexarche';
    if (t.includes('historial obstetrico') && t.includes('indica')) return 'obstetric_history_type';
    if (t.includes('tabla') || t.includes('detalles de tus embarazos')) return 'ho_table_results';
    if (t.includes('sexualmente activa')) return 'sexually_active';
    if (t.includes('embarazo') && t.includes('buscando')) return 'gyn_fertility_intent';
    if (t.includes('ciclos') && t.includes('regulares')) return 'gyn_cycles';
    if (t.includes('cuantos dias dura') || t.includes('duracion')) return 'gyn_cycles_duration';
    if ((t.includes('frecuencia') && t.includes('ciclo')) || t.includes('cada cuantos') || t.includes('cada cuántos') || t.includes('cada cuanto')) return 'gyn_cycles_frequency';
    if (t.includes('dismenorrea') || t.includes('dolor') && t.includes('menstruacion')) return 'gyn_dysmenorrhea';
    if (t.includes('del 1 al 10') && t.includes('menstrua')) return 'gyn_dysmenorrhea_scale_value';
    if ((t.includes('fum') && !t.includes('fumas')) || t.includes('ultima menstruacion')) return 'gyn_fum';
    if (t.includes('mac') || t.includes('anticonceptivo')) {
        if (t.includes('utilizas')) return 'gyn_mac_bool';
        if (t.includes('metodo')) return 'gyn_mac';
    }
    if (t.includes('chequeo') && t.includes('anterior')) return 'gyn_previous_checkups';
    if (t.includes('citologia') || t.includes('pap')) return 'gyn_last_pap_smear';
    if (t.includes('dolor durante las relaciones') || t.includes('dispareunia')) {
        if (t.includes('1 al 10') || t.includes('intensidad') || t.includes('escala')) return 'functional_dispareunia_deep_scale';
        return 'functional_dispareunia';
    }
    if (t.includes('tipo de dolor') && t.includes('relaciones')) return 'functional_dispareunia_type';
    if (t.includes('dolor en las piernas')) return 'functional_leg_pain';
    if (t.includes('gastrointestinal') && t.includes('antes')) return 'functional_gastro_before';
    if (t.includes('gastrointestinal') && t.includes('durante')) return 'functional_gastro_during';
    if (t.includes('evacuar') && (t.includes('dolor') || t.includes('disquecia'))) {
        if (t.includes('1 al 10') || t.includes('fuerte') || t.includes('intensidad')) return 'functional_dischezia_scale';
        return 'functional_dischezia';
    }
    if (t.includes('frecuencia') && t.includes('evacuar')) return 'functional_bowel_freq';
    if (t.includes('urinario') || t.includes('orinar')) {
        if (t.includes('problema') || t.includes('molestia')) return 'functional_urinary_problem';
        if (t.includes('dolor')) {
            if (t.includes('1 al 10') || t.includes('intensidad') || t.includes('escala')) return 'functional_urinary_pain_scale';
            return 'functional_urinary_pain';
        }
        if (t.includes('irritacion') || t.includes('ardor')) return 'functional_urinary_irritation';
        if (t.includes('incontinencia') || t.includes('escapes')) return 'functional_urinary_incontinence';
        if (t.includes('noche') || t.includes('levantas')) return 'functional_urinary_nocturia';
    }
    if (t.includes('actividad fisica') || t.includes('ejercicio')) return 'habits_physical_activity';
    if (t.includes('fuma') || t.includes('tabaco') || t.includes('cigarrillo')) return 'habits_smoking';
    if (t.includes('alcohol') || t.includes('bebes')) return 'habits_alcohol';
    if (t.includes('sustancia') || t.includes('drogas')) return 'habits_substance_use';
    return null;
};

export default function PreconsultaWidget({ isOpen, onClose, appointmentId, primaryColor = '#4F46E5', doctorName = "Dra. Mariel Herrera" }) {
    const [flowData, setFlowData] = useState(jsonDataFlow);
    const [loading, setLoading] = useState(false);
    const [doctorConfig, setDoctorConfig] = useState({});
    const [expirationData, setExpirationData] = useState(null);
    const [initialAnswers, setInitialAnswers] = useState({});

    useEffect(() => {
        if (!isOpen || !appointmentId) return;

        const loadConfig = async () => {
            try {
                setLoading(true);
                // Load Flow from Backend (if customized)
                const questions = await preconsultationService.getQuestionsByAppointment(appointmentId);

                let activeFlow = jsonDataFlow;

                if (questions && questions.length > 0) {
                    // ... (Existing flow mapping logic) ...
                    console.log("[Preconsulta] Using Rigid Key-Value Architecture");
                    const finalNodes = JSON.parse(JSON.stringify(jsonDataFlow.nodes));
                    const backendMap = {};
                    questions.forEach(q => {
                        const key = q.save_to || inferSaveToKey(q.text);
                        if (key) {
                            backendMap[key] = q;
                        }
                    });

                    activeFlow = {
                        ...jsonDataFlow,
                        nodes: finalNodes
                    };
                }

                // Load Preconsulta Config (Patient Name etc)
                const config = await preconsultationService.getConfig(appointmentId);
                setDoctorConfig(config);

                // Expiration Check
                if (config.status === 'completed' || config.summary || config.has_answers) {
                    setExpirationData(config);
                    setLoading(false);
                    return;
                }

                // Auto-Seed Data
                const seeded = {
                    full_name: config.patient_name || '',
                    phone: config.patient_phone || '',
                    occupation: config.occupation || '',
                    address: config.residence || ''
                };
                setInitialAnswers(seeded);

                if (activeFlow.start_node === 'ASK_FULL_NAME' || !activeFlow.start_node) {
                    activeFlow.start_node = 'ASK_MOTHER_HISTORY_BOOL';
                }

                setFlowData(activeFlow);

            } catch (err) {
                console.error("Error loading preconsulta:", err);
                // Ideally handle error state in UI
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [isOpen, appointmentId]);

    const handleSubmit = async (answers) => {
        await preconsultationService.submitAnswers(appointmentId, answers);
    };

    return (
        <PreconsultaUI
            isOpen={isOpen}
            onClose={onClose}
            flowData={flowData}
            doctorConfig={doctorConfig}
            initialAnswers={initialAnswers}
            onSubmit={handleSubmit}
            loading={loading}
            primaryColor={primaryColor}
            expirationData={expirationData}
            // Ensure we jump to the correct start node if it was modified
            startNodeIdOverride={flowData.start_node}
        />
    );
}
