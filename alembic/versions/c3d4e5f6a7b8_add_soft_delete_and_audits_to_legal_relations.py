"""add soft delete columns and legal_relation_audits table

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f7
Create Date: 2026-11-15 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add soft-delete and unlinked tracking columns to legal_relations
    op.add_column(
        'legal_relations',
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False)
    )
    op.create_index('ix_legal_relations_is_active', 'legal_relations', ['is_active'])

    op.add_column(
        'legal_relations',
        sa.Column('unlinked_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'legal_relations',
        sa.Column('unlinked_by', postgresql.UUID(as_uuid=True), nullable=True)
    )

    # 2. Create legal_relation_audits table
    op.execute('DROP TABLE IF EXISTS legal_relation_audits CASCADE;')
    op.create_table(
        'legal_relation_audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('relation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('parent_law_id', sa.String(length=150), nullable=False),
        sa.Column('target_document_id', sa.String(length=150), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('performed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_legal_relation_audits_parent_law_id', 'legal_relation_audits', ['parent_law_id'])
    op.create_index('ix_legal_relation_audits_target_document_id', 'legal_relation_audits', ['target_document_id'])
    op.create_index('ix_legal_relation_audits_action', 'legal_relation_audits', ['action'])
    op.create_index('ix_legal_relation_audits_relation_id', 'legal_relation_audits', ['relation_id'])


def downgrade() -> None:
    op.drop_table('legal_relation_audits')
    op.drop_column('legal_relations', 'unlinked_by')
    op.drop_column('legal_relations', 'unlinked_at')
    op.drop_index('ix_legal_relations_is_active', table_name='legal_relations')
    op.drop_column('legal_relations', 'is_active')
