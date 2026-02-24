"""drop pending_notifications unique constraint for testing

Revision ID: 20260224_drop_pending_unique
Revises: 343b9cba16c3
Create Date: 2026-02-24 00:00:00.000000

PROPÓSITO:
  Elimina la restricción UNIQUE(recipient_id, notification_rule_id, date(scheduled_for))
  de pending_notifications para permitir múltiples notificaciones del mismo tipo por día.
  La guardia de duplicados ahora se maneja en código via NOTIFICATIONS_DEBUG_MODE.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260224_drop_pending_unique'
down_revision = '343b9cba16c3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL no permite DROP INDEX directamente cuando hay un CONSTRAINT asociado.
    # Primero eliminamos el CONSTRAINT (que también elimina el índice implícito),
    # luego creamos un índice no-único de reemplazo para mantener el rendimiento.
    op.execute(
        "ALTER TABLE pending_notifications DROP CONSTRAINT IF EXISTS uix_pending_user_rule_date;"
    )
    # También intentar eliminar el índice por si existe independiente del constraint
    op.execute("DROP INDEX IF EXISTS uix_pending_user_rule_date;")

    # Crear índice no-único de reemplazo (para mantener rendimiento en queries)
    op.create_index(
        'ix_pending_user_rule_date',
        'pending_notifications',
        ['recipient_id', 'notification_rule_id'],
        unique=False
    )


def downgrade() -> None:
    # Restaurar el constraint único (puede fallar si hay duplicados en BD)
    op.drop_index('ix_pending_user_rule_date', table_name='pending_notifications')
    op.execute("""
        ALTER TABLE pending_notifications
        ADD CONSTRAINT uix_pending_user_rule_date
        UNIQUE (recipient_id, notification_rule_id, DATE(scheduled_for));
    """)
