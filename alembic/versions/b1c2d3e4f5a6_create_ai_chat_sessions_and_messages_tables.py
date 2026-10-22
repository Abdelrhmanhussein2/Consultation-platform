"""create_ai_chat_sessions_and_messages_tables

Revision ID: b1c2d3e4f5a6
Revises: 6efe0b81b396
Create Date: 2026-10-20 20:41:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '6efe0b81b396'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Create ai_chat_role ENUM type safely
    ai_chat_role_enum = postgresql.ENUM('user', 'assistant', name='ai_chat_role')
    ai_chat_role_enum.create(bind, checkfirst=True)

    # 2. Create ai_chat_sessions table if it doesn't already exist
    if 'ai_chat_sessions' not in existing_tables:
        op.create_table(
            'ai_chat_sessions',
            sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=True),
            sa.Column('is_pinned', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('pinned_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_ai_chat_sessions_user_id'), 'ai_chat_sessions', ['user_id'], unique=False)
        op.create_index('ix_ai_chat_sessions_user_pinned', 'ai_chat_sessions', ['user_id', 'is_pinned', 'updated_at'], unique=False)

    # 3. Create ai_chat_messages table if it doesn't already exist
    if 'ai_chat_messages' not in existing_tables:
        op.create_table(
            'ai_chat_messages',
            sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
            sa.Column('session_id', sa.UUID(), nullable=False),
            sa.Column('role', postgresql.ENUM('user', 'assistant', name='ai_chat_role', create_type=False), nullable=False),
            sa.Column('content_encrypted', sa.Text(), nullable=False),
            sa.Column('citations', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['session_id'], ['ai_chat_sessions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_ai_chat_messages_session_id'), 'ai_chat_messages', ['session_id'], unique=False)
        op.create_index(op.f('ix_ai_chat_messages_created_at'), 'ai_chat_messages', ['created_at'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Drop ai_chat_messages table & indexes
    if 'ai_chat_messages' in existing_tables:
        op.drop_index(op.f('ix_ai_chat_messages_created_at'), table_name='ai_chat_messages')
        op.drop_index(op.f('ix_ai_chat_messages_session_id'), table_name='ai_chat_messages')
        op.drop_table('ai_chat_messages')

    # 2. Drop ai_chat_sessions table & indexes
    if 'ai_chat_sessions' in existing_tables:
        op.drop_index('ix_ai_chat_sessions_user_pinned', table_name='ai_chat_sessions')
        op.drop_index(op.f('ix_ai_chat_sessions_user_id'), table_name='ai_chat_sessions')
        op.drop_table('ai_chat_sessions')

    # 3. Drop ai_chat_role ENUM
    ai_chat_role_enum = postgresql.ENUM('user', 'assistant', name='ai_chat_role')
    ai_chat_role_enum.drop(bind, checkfirst=True)
