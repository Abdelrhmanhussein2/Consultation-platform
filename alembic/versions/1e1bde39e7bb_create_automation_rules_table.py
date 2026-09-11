"""create_automation_rules_table

Revision ID: 1e1bde39e7bb
Revises: 2204511fa459
Create Date: 2026-09-09 19:30:37.983626

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = '1e1bde39e7bb'
down_revision: Union[str, Sequence[str], None] = '2204511fa459'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'automation_rules' not in tables:
        op.create_table(
            'automation_rules',
            sa.Column('id', UUID(as_uuid=True), primary_key=True,
                      server_default=sa.text('gen_random_uuid()'), nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('trigger_event', sa.String(100), nullable=False),
            sa.Column('condition_field', sa.String(100), nullable=True),
            sa.Column('condition_op', sa.String(50), nullable=True, server_default='always'),
            sa.Column('condition_value', sa.String(255), nullable=True),
            sa.Column('action_type', sa.String(100), nullable=False),
            sa.Column('action_config', JSONB(), nullable=True),
            sa.Column('status', sa.String(50), nullable=False, server_default='active'),
            sa.Column('created_by', UUID(as_uuid=True),
                      sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.text('now()')),
            sa.Column('run_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('success_rate', sa.Float(), nullable=False, server_default='100.0'),
            sa.Column('last_effect', sa.Text(), nullable=True),
        )

    # Check and create indexes safely
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('automation_rules')] if 'automation_rules' in inspector.get_table_names() else []
    if 'ix_automation_rules_trigger_event' not in existing_indexes:
        op.create_index('ix_automation_rules_trigger_event', 'automation_rules', ['trigger_event'])
    if 'ix_automation_rules_status' not in existing_indexes:
        op.create_index('ix_automation_rules_status', 'automation_rules', ['status'])


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_automation_rules_status")
    op.execute("DROP INDEX IF EXISTS ix_automation_rules_trigger_event")
    op.execute("DROP TABLE IF EXISTS automation_rules")

