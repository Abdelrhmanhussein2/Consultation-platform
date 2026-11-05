"""add token and cache fields to ai_chat_messages

Revision ID: f5a6b7c8d9e0
Revises: f4a5b6c7d8e9
Create Date: 2026-11-05 02:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f5a6b7c8d9e0'
down_revision: Union[str, Sequence[str], None] = 'f4a5b6c7d8e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('ai_chat_messages', sa.Column('prompt_tokens', sa.Integer(), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('completion_tokens', sa.Integer(), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('total_tokens', sa.Integer(), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('model_name', sa.String(length=100), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('latency_ms', sa.Integer(), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('is_cached', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('ai_chat_messages', sa.Column('cache_type', sa.String(length=20), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('cache_key', sa.String(length=500), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('cache_similarity_score', sa.Float(), nullable=True))
    op.add_column('ai_chat_messages', sa.Column('mode', sa.String(length=50), server_default='default', nullable=True))
    op.create_index(op.f('ix_ai_chat_messages_cache_key'), 'ai_chat_messages', ['cache_key'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ai_chat_messages_cache_key'), table_name='ai_chat_messages')
    op.drop_column('ai_chat_messages', 'mode')
    op.drop_column('ai_chat_messages', 'cache_similarity_score')
    op.drop_column('ai_chat_messages', 'cache_key')
    op.drop_column('ai_chat_messages', 'cache_type')
    op.drop_column('ai_chat_messages', 'is_cached')
    op.drop_column('ai_chat_messages', 'latency_ms')
    op.drop_column('ai_chat_messages', 'model_name')
    op.drop_column('ai_chat_messages', 'total_tokens')
    op.drop_column('ai_chat_messages', 'completion_tokens')
    op.drop_column('ai_chat_messages', 'prompt_tokens')

