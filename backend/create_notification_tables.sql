-- Create notification_rules table matching SQLAlchemy model
CREATE TABLE IF NOT EXISTS notification_rules (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    notification_type VARCHAR NOT NULL,
    trigger_condition JSON NOT NULL DEFAULT '{}',
    channel VARCHAR NOT NULL DEFAULT 'email',
    message_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create notification_logs table matching SQLAlchemy model
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    notification_rule_id INTEGER REFERENCES notification_rules(id) ON DELETE SET NULL,
    recipient_id INTEGER NOT NULL REFERENCES cycle_users(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR DEFAULT 'sent',
    channel_used VARCHAR,
    error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_rules_tenant ON notification_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id);
