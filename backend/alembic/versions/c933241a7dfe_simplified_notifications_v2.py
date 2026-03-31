"""simplified_notifications_v2

Revision ID: c933241a7dfe
Revises: 20260215_pnd_notif
Create Date: 2026-02-15 20:37:15.070163

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c933241a7dfe'
down_revision = 'merge_all_notif'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Drop obsolete columns from notification_rules (if exists)
    conn = op.get_bind()
    columns = [c['name'] for c in sa.inspect(conn).get_columns('notification_rules')]
    if 'name' in columns:
        op.drop_column('notification_rules', 'name')
    
    # 2. Add new columns to notification_rules if missing
    if 'priority' not in columns:
        op.add_column('notification_rules', sa.Column('priority', sa.Integer(), nullable=True))
    if 'title_template' not in columns:
        op.add_column('notification_rules', sa.Column('title_template', sa.String(length=255), nullable=True))
    if 'message_text_template' not in columns:
        op.add_column('notification_rules', sa.Column('message_text_template', sa.Text(), nullable=True))
    if 'send_time' not in columns:
        op.add_column('notification_rules', sa.Column('send_time', sa.String(length=10), nullable=True))
    if 'is_edited' not in columns:
        op.add_column('notification_rules', sa.Column('is_edited', sa.Boolean(), nullable=True))
    
    # 3. Create unique index if missing
    indexes = [idx['name'] for idx in sa.inspect(conn).get_indexes('notification_rules')]
    if 'idx_rule_tenant_type' not in indexes:
        op.create_index('idx_rule_tenant_type', 'notification_rules', ['tenant_id', 'notification_type'], unique=True)
    
    # 4. Update notification_logs
    log_columns = [c['name'] for c in sa.inspect(conn).get_columns('notification_logs')]
    if 'notification_type' not in log_columns:
        op.add_column('notification_logs', sa.Column('notification_type', sa.String(length=50), nullable=True))
    if 'title_sent' not in log_columns:
        op.add_column('notification_logs', sa.Column('title_sent', sa.String(length=255), nullable=True))
    
    # 5. Update pending_notifications
    pending_columns = [c['name'] for c in sa.inspect(conn).get_columns('pending_notifications')]
    if 'message_text' not in pending_columns:
        op.add_column('pending_notifications', sa.Column('message_text', sa.Text(), nullable=True))

    # 6. FIXED: Add missing columns to cycle_notification_settings
    settings_columns = [c['name'] for c in sa.inspect(conn).get_columns('cycle_notification_settings')]
    new_cols = [
        ('prenatal_ultrasounds', sa.Boolean(), True),
        ('prenatal_lab_results', sa.Boolean(), True),
        ('prenatal_milestones', sa.Boolean(), True),
        ('prenatal_daily_tips', sa.Boolean(), True),
        ('prenatal_symptom_alerts', sa.Boolean(), True),
        ('cycle_period_predictions', sa.Boolean(), True),
        ('cycle_fertile_window', sa.Boolean(), True),
        ('cycle_pms_symptoms', sa.Boolean(), True),
        ('custom_preferences', sa.JSON(), None),
    ]
    for name, type_, default in new_cols:
        if name not in settings_columns:
            op.add_column('cycle_notification_settings', sa.Column(name, type_, nullable=True, server_default=sa.text('true') if default is True else None))


def downgrade() -> None:
    op.drop_column('pending_notifications', 'message_text')
    op.drop_column('notification_logs', 'title_sent')
    op.drop_column('notification_logs', 'notification_type')
    op.drop_index('idx_rule_tenant_type', table_name='notification_rules')
    op.drop_column('notification_rules', 'is_edited')
    op.drop_column('notification_rules', 'send_time')
    op.drop_column('notification_rules', 'message_text_template')
    op.drop_column('notification_rules', 'title_template')
    op.drop_column('notification_rules', 'priority')
    op.add_column('notification_rules', sa.Column('name', sa.String(length=255), nullable=False))
