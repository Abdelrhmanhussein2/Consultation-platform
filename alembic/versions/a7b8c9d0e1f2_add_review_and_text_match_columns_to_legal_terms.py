"""add_review_and_text_match_columns_to_legal_terms

Revision ID: a7b8c9d0e1f2
Revises: c4d5e6f7a8b9
Create Date: 2026-10-24
"""
from alembic import op
import sqlalchemy as sa

revision = 'a7b8c9d0e1f2'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('legal_terms', sa.Column('text_match_status', sa.String(length=50), nullable=True))
    op.add_column('legal_terms', sa.Column('normalization_level', sa.String(length=50), nullable=True))
    op.add_column('legal_terms', sa.Column('version_basis', sa.String(length=50), nullable=True))
    op.add_column('legal_terms', sa.Column('review_status', sa.String(length=30), server_default='pending', nullable=False))
    op.add_column('legal_terms', sa.Column('review_notes', sa.Text(), nullable=True))
    op.add_column('legal_terms', sa.Column('reviewed_by', sa.String(length=100), nullable=True))
    op.add_column('legal_terms', sa.Column('reviewed_at', sa.TIMESTAMP(timezone=True), nullable=True))

    op.create_check_constraint(
        'chk_legal_terms_review_status',
        'legal_terms',
        "review_status IN ('pending', 'approved', 'rejected')"
    )

    op.create_index('ix_legal_terms_review_status', 'legal_terms', ['review_status'])
    op.create_index('ix_legal_terms_text_match_status', 'legal_terms', ['text_match_status'])


def downgrade():
    op.drop_index('ix_legal_terms_text_match_status', table_name='legal_terms')
    op.drop_index('ix_legal_terms_review_status', table_name='legal_terms')
    op.drop_constraint('chk_legal_terms_review_status', 'legal_terms', type_='check')
    op.drop_column('legal_terms', 'reviewed_at')
    op.drop_column('legal_terms', 'reviewed_by')
    op.drop_column('legal_terms', 'review_notes')
    op.drop_column('legal_terms', 'review_status')
    op.drop_column('legal_terms', 'version_basis')
    op.drop_column('legal_terms', 'normalization_level')
    op.drop_column('legal_terms', 'text_match_status')
