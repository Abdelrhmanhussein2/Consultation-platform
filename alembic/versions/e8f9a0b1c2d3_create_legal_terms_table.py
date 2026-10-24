"""create_legal_terms_table

Revision ID: e8f9a0b1c2d3
Revises: b1c2d3e4f5a6
Create Date: 2026-10-24
"""
from alembic import op
import sqlalchemy as sa

revision = 'e8f9a0b1c2d3'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    # Enable pg_trgm for Arabic substring matching
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    op.create_table(
        'legal_terms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('popular_term', sa.Text(), nullable=False),
        sa.Column('legislative_term', sa.Text(), nullable=False),
        sa.Column('ref_type', sa.Text(), nullable=True),
        sa.Column('law_name', sa.Text(), nullable=True),
        sa.Column('law_number_year', sa.Text(), nullable=True),
        sa.Column('article_reference', sa.Text(), nullable=True),
        sa.Column('literal_text', sa.Text(), nullable=True),
        sa.Column('official_url', sa.Text(), nullable=True),
        sa.Column('neo4j_article_id', sa.Text(), nullable=True),
        sa.Column('row_hash', sa.Text(), nullable=False),
        sa.Column('import_batch_id', sa.Text(), nullable=True),
        sa.Column('imported_at', sa.TIMESTAMP(timezone=True),
                  server_default=sa.text('NOW()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('superseded_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('row_hash', name='uq_legal_terms_row_hash'),
        sa.ForeignKeyConstraint(['superseded_by'], ['legal_terms.id'],
                                ondelete='SET NULL'),
    )

    # GIN trigram indexes for fast Arabic prefix/substring search
    op.execute(
        "CREATE INDEX ix_legal_terms_popular_trgm ON legal_terms "
        "USING gin(popular_term gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX ix_legal_terms_legislative_trgm ON legal_terms "
        "USING gin(legislative_term gin_trgm_ops)"
    )
    op.create_index('ix_legal_terms_is_active', 'legal_terms', ['is_active'])
    op.create_index('ix_legal_terms_row_hash', 'legal_terms', ['row_hash'])


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_legal_terms_legislative_trgm")
    op.execute("DROP INDEX IF EXISTS ix_legal_terms_popular_trgm")
    op.drop_index('ix_legal_terms_row_hash', table_name='legal_terms')
    op.drop_index('ix_legal_terms_is_active', table_name='legal_terms')
    op.drop_table('legal_terms')
