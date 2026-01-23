-- Create online_consultation_settings table
CREATE TABLE IF NOT EXISTS online_consultation_settings (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER UNIQUE NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    first_consultation_price DOUBLE PRECISION DEFAULT 50.0 NOT NULL,
    followup_price DOUBLE PRECISION DEFAULT 40.0 NOT NULL,
    currency VARCHAR DEFAULT 'USD' NOT NULL,
    payment_methods JSONB DEFAULT '["zelle", "paypal", "bank_transfer"]' NOT NULL,
    available_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}' NOT NULL,
    session_duration_minutes INTEGER DEFAULT 45 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_online_consultation_settings_id ON online_consultation_settings(id);
CREATE INDEX IF NOT EXISTS ix_online_consultation_settings_doctor_id ON online_consultation_settings(doctor_id);
