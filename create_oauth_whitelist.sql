-- Manual creation of oauth_whitelist table (bypassing Alembic migration issues)

CREATE TABLE IF NOT EXISTS oauth_whitelist (
    id SERIAL PRIMARY KEY,
    email VARCHAR,
    domain VARCHAR,
    added_by INTEGER REFERENCES doctors(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    CONSTRAINT email_or_domain_required CHECK (email IS NOT NULL OR domain IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ix_oauth_whitelist_email ON oauth_whitelist (email);
CREATE INDEX IF NOT EXISTS ix_oauth_whitelist_domain ON oauth_whitelist (domain);
CREATE INDEX IF NOT EXISTS ix_oauth_whitelist_is_active ON oauth_whitelist (is_active);

-- Insert existing .env whitelist entries
INSERT INTO oauth_whitelist (email, is_active, notes)
VALUES ('marilouh.mh@gmail.com', true, 'Migrated from .env configuration')
ON CONFLICT DO NOTHING;

INSERT INTO oauth_whitelist (domain, is_active, notes)
VALUES ('@gynsys.com', true, 'Migrated from .env configuration')
ON CONFLICT DO NOTHING;
