CREATE TABLE IF NOT EXISTS social_carousels (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    content JSONB NOT NULL,
    design JSONB NOT NULL,
    global_settings JSONB NOT NULL,
    elements JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id)
);
CREATE INDEX IF NOT EXISTS ix_social_carousels_id ON social_carousels (id);
