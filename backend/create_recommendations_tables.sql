-- Create recommendation_categories table
CREATE TABLE IF NOT EXISTS recommendation_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES doctors(id),
    name VARCHAR NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_recommendation_categories_id ON recommendation_categories(id);

-- Create recommendations table  
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES doctors(id),
    category_id INTEGER REFERENCES recommendation_categories(id),
    title VARCHAR NOT NULL,
    description TEXT,
    image_url VARCHAR,
    action_type VARCHAR DEFAULT 'LINK',
    action_url VARCHAR,
    price VARCHAR,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS ix_recommendations_id ON recommendations(id);
