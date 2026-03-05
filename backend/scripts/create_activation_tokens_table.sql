CREATE TABLE IF NOT EXISTS patient_activation_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(128) UNIQUE NOT NULL,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pat_token ON patient_activation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pat_email ON patient_activation_tokens(email);
