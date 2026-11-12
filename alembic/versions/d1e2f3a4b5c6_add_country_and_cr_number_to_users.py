"""add country and commercial_register_number to users

Revision ID: d1e2f3a4b5c6
Revises: ea8941e7a0c8
Create Date: 2026-11-12 15:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = 'ea8941e7a0c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('commercial_register_number', sa.String(length=50), nullable=True)
    )
    op.add_column(
        'users',
        sa.Column('country', sa.String(length=50), server_default='الأردن', nullable=False)
    )


def downgrade() -> None:
    op.drop_column('users', 'country')
    op.drop_column('users', 'commercial_register_number')

