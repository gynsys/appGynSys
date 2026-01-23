-- Drop existing tables
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS recommendation_categories CASCADE;

-- Create recommendation_categories table
CREATE TABLE recommendation_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL
);

-- Create recommendations table
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES recommendation_categories(id) ON DELETE SET NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    image_url VARCHAR,
    action_type VARCHAR DEFAULT 'LINK',
    action_url VARCHAR,
    price VARCHAR,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_recommendations_tenant ON recommendations(tenant_id);
CREATE INDEX idx_recommendation_categories_tenant ON recommendation_categories(tenant_id);

-- Verify
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('recommendations', 'recommendation_categories') 
ORDER BY table_name, ordinal_position;
