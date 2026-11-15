"""create legal_document_metadata and legal_repeal_audits tables

Revision ID: a1b2c3d4e5f7
Revises: 9c8d7e6f5a4b
Create Date: 2026-11-15 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, Sequence[str], None] = '9c8d7e6f5a4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('DROP TABLE IF EXISTS legal_repeal_audits CASCADE;')
    op.execute('DROP TABLE IF EXISTS legal_document_metadata CASCADE;')

    op.create_table(
        'legal_document_metadata',
        sa.Column('document_id', sa.String(length=150), nullable=False),
        sa.Column('document_type', sa.String(length=50), server_default='law', nullable=False),
        sa.Column('title', sa.String(length=300), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='ساري', nullable=False),
        sa.Column('repealed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('repealed_by_user', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('repeal_reason', sa.Text(), nullable=True),
        sa.Column('repealed_by_document_id', sa.String(length=150), nullable=True),
        sa.Column('sync_status', sa.String(length=20), server_default='synced', nullable=False),
        sa.Column('last_sync_error', sa.Text(), nullable=True),
        sa.Column('synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('document_id')
    )
    op.create_index('ix_legal_document_metadata_document_id', 'legal_document_metadata', ['document_id'])
    op.create_index('ix_legal_document_metadata_document_type', 'legal_document_metadata', ['document_type'])
    op.create_index('ix_legal_document_metadata_status', 'legal_document_metadata', ['status'])
    op.create_index('ix_legal_document_metadata_sync_status', 'legal_document_metadata', ['sync_status'])

    op.create_table(
        'legal_repeal_audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('document_id', sa.String(length=150), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('performed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('repealed_by_document_id', sa.String(length=150), nullable=True),
        sa.Column('dependents_actions', sa.JSON(), nullable=True),
        sa.Column('summary', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_legal_repeal_audits_document_id', 'legal_repeal_audits', ['document_id'])
    op.create_index('ix_legal_repeal_audits_action', 'legal_repeal_audits', ['action'])


def downgrade() -> None:
    op.drop_table('legal_repeal_audits')
    op.drop_table('legal_document_metadata')
