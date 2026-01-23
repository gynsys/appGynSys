
import React, { useState } from 'react';
import PreconsultaUI from './PreconsultaUI';

export default function PreconsultaPreview({ isOpen, onClose, directFlow }) {

    // Preview Configuration
    const previewConfig = {
        doctor_name: "Tu Nombre",
        patient_name: "Paciente de Prueba"
    };

    const handleMockSubmit = async (answers) => {
        // Mock API Latency
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("Mock Submit Answers:", answers);
                resolve();
            }, 1000);
        });
    };

    return (
        <PreconsultaUI
            isOpen={isOpen}
            onClose={onClose}
            flowData={directFlow}
            doctorConfig={previewConfig}
            onSubmit={handleMockSubmit}
            loading={false}
            forceViewMode="chat"
            startNodeIdOverride={directFlow?.start_node}
        />
    );
}
