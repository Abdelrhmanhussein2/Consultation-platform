"""create_user_highlights_table

Revision ID: 6efe0b81b396
Revises: f3bfa4b1edd3
Create Date: 2026-10-08 15:36:19.910390

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6efe0b81b396'
down_revision: Union[str, Sequence[str], None] = 'f3bfa4b1edd3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('user_highlights',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('law_id', sa.String(length=255), nullable=False),
        sa.Column('art_num', sa.Integer(), nullable=True),
        sa.Column('art_title', sa.String(length=255), nullable=True),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('color', sa.String(length=50), nullable=True, server_default='#3B82F6'),
        sa.Column('bg_tint', sa.String(length=50), nullable=True, server_default='#DBEAFE'),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('starred', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_highlights_law_id'), 'user_highlights', ['law_id'], unique=False)
    op.create_index(op.f('ix_user_highlights_user_id'), 'user_highlights', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_highlights_user_id'), table_name='user_highlights')
    op.drop_index(op.f('ix_user_highlights_law_id'), table_name='user_highlights')
    op.drop_table('user_highlights')
    # ### end Alembic commands ###
