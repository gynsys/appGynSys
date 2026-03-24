import React, { useEffect, useState } from 'react';
import PreconsultaUI from './PreconsultaUI';
import jsonDataFlow from '../data/personal_info_flow.json';
import api from '../../../lib/axios';

export default function UnifiedOnboardingBot({ doctorSlug, onClose }) {
    const [flowData, setFlowData] = useState(jsonDataFlow);
    const [loading, setLoading] = useState(false);
    const [doctorConfig, setDoctorConfig] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!doctorSlug) return;

        const loadConfig = async () => {
            try {
                setLoading(true);
                // Load Doctor Config for Onboarding
                const response = await api.get(`/onboarding/config/${doctorSlug}`);
                setDoctorConfig(response.data);
                
                // Force flow to start from the beginning (Full Name)
                const activeFlow = { ...jsonDataFlow };
                activeFlow.start_node = 'ASK_FULL_NAME';
                setFlowData(activeFlow);

            } catch (err) {
                console.error("Error loading onboarding config:", err);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [doctorSlug]);

    const handleSubmit = async (answers) => {
        setSubmitting(true);
        try {
            await api.post(`/onboarding/submit/${doctorSlug}`, answers);
            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting onboarding:", error);
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PreconsultaUI
            isOpen={true}
            onClose={onClose}
            flowData={flowData}
            doctorConfig={doctorConfig}
            onSubmit={handleSubmit}
            loading={loading || submitting}
            primaryColor={doctorConfig.theme_primary_color || '#4F46E5'}
            forceViewMode="chat" // Directly to chat for "Fast Track"
        />
    );
}
