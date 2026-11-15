"""create legal_relations table with reliability and metadata fields

Revision ID: 9c8d7e6f5a4b
Revises: f8b7c6d5e4a3
Create Date: 2026-11-15 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '9c8d7e6f5a4b'
down_revision: Union[str, Sequence[str], None] = 'f8b7c6d5e4a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('DROP TABLE IF EXISTS legal_relations CASCADE;')
    op.create_table(
        'legal_relations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('parent_law_id', sa.String(length=150), nullable=False),
        sa.Column('target_document_id', sa.String(length=150), nullable=False),
        sa.Column('target_title', sa.String(length=300), nullable=True),
        sa.Column('relation_domain', sa.String(length=50), server_default='legislative', nullable=False),
        sa.Column('relation_type', sa.String(length=50), nullable=False),
        sa.Column('sub_category', sa.String(length=100), nullable=False),
        sa.Column('document_type', sa.String(length=100), nullable=True),
        sa.Column('article_ref', sa.String(length=100), nullable=True),
        sa.Column('effective_date', sa.String(length=50), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('document_status', sa.String(length=50), server_default='ساري', nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('sync_status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('last_sync_error', sa.Text(), nullable=True),
        sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('retry_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('parent_law_id', 'target_document_id', 'relation_type', 'sub_category', name='uq_legal_relation_link')
    )
    op.create_index('ix_legal_relations_parent_law_id', 'legal_relations', ['parent_law_id'])
    op.create_index('ix_legal_relations_target_document_id', 'legal_relations', ['target_document_id'])
    op.create_index('ix_legal_relations_relation_domain', 'legal_relations', ['relation_domain'])
    op.create_index('ix_legal_relations_relation_type', 'legal_relations', ['relation_type'])
    op.create_index('ix_legal_relations_sub_category', 'legal_relations', ['sub_category'])
    op.create_index('ix_legal_relations_sync_status', 'legal_relations', ['sync_status'])


def downgrade() -> None:
    op.drop_index('ix_legal_relations_sync_status', table_name='legal_relations')
    op.drop_index('ix_legal_relations_sub_category', table_name='legal_relations')
    op.drop_index('ix_legal_relations_relation_type', table_name='legal_relations')
    op.drop_index('ix_legal_relations_relation_domain', table_name='legal_relations')
    op.drop_index('ix_legal_relations_target_document_id', table_name='legal_relations')
    op.drop_index('ix_legal_relations_parent_law_id', table_name='legal_relations')
    op.drop_table('legal_relations')
