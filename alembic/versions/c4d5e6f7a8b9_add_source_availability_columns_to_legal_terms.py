"""add_source_availability_columns_to_legal_terms

Revision ID: c4d5e6f7a8b9
Revises: e8f9a0b1c2d3
Create Date: 2026-10-24
"""
from alembic import op
import sqlalchemy as sa

revision = 'c4d5e6f7a8b9'
down_revision = 'e8f9a0b1c2d3'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('legal_terms', sa.Column('law_id', sa.String(length=100), nullable=True))
    op.add_column('legal_terms', sa.Column('version_id', sa.String(length=100), nullable=True))
    op.add_column('legal_terms', sa.Column('match_status', sa.String(length=30), nullable=True))
    op.add_column('legal_terms', sa.Column('is_openable', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('legal_terms', sa.Column('verified_at', sa.TIMESTAMP(timezone=True), nullable=True))

    # Add CHECK constraint for match_status
    op.create_check_constraint(
        'chk_legal_terms_match_status',
        'legal_terms',
        "match_status IS NULL OR match_status IN ('verified', 'ambiguous', 'not_found', 'not_in_graph')"
    )

    op.create_index('ix_legal_terms_law_id', 'legal_terms', ['law_id'])
    op.create_index('ix_legal_terms_is_openable', 'legal_terms', ['is_openable'])
    op.create_index('ix_legal_terms_match_status', 'legal_terms', ['match_status'])


def downgrade():
    op.drop_index('ix_legal_terms_match_status', table_name='legal_terms')
    op.drop_index('ix_legal_terms_is_openable', table_name='legal_terms')
    op.drop_index('ix_legal_terms_law_id', table_name='legal_terms')
    op.drop_constraint('chk_legal_terms_match_status', 'legal_terms', type_='check')
    op.drop_column('legal_terms', 'verified_at')
    op.drop_column('legal_terms', 'is_openable')
    op.drop_column('legal_terms', 'match_status')
    op.drop_column('legal_terms', 'version_id')
    op.drop_column('legal_terms', 'law_id')
