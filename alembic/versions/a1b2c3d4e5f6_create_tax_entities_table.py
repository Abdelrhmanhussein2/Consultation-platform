"""create tax_entities table and update official_templates

Revision ID: a1b2c3d4e5f6
Revises: f5a6b7c8d9e0
Create Date: 2026-11-05 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f5a6b7c8d9e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update official_templates
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='official_templates' AND column_name='is_active'
            ) THEN
                ALTER TABLE official_templates ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='official_templates' AND column_name='updated_by'
            ) THEN
                ALTER TABLE official_templates ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
            END IF;
        END $$;
    """)

    # 2. Create tax_entities table
    op.create_table(
        'tax_entities',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('name_normalized', sa.String(length=255), nullable=False),
        sa.Column('tax_number', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('updated_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    op.create_index(
        'ix_tax_entities_tax_number_active',
        'tax_entities',
        ['tax_number'],
        unique=True,
        postgresql_where=sa.text('is_active = true')
    )
    op.create_index('ix_tax_entities_name_normalized', 'tax_entities', ['name_normalized'], unique=False)
    op.create_index('ix_tax_entities_entity_type', 'tax_entities', ['entity_type'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_tax_entities_entity_type', table_name='tax_entities')
    op.drop_index('ix_tax_entities_name_normalized', table_name='tax_entities')
    op.drop_index('ix_tax_entities_tax_number_active', table_name='tax_entities')
    op.drop_table('tax_entities')
    op.execute("ALTER TABLE official_templates DROP COLUMN IF EXISTS updated_by;")
    op.execute("ALTER TABLE official_templates DROP COLUMN IF EXISTS is_active;")

