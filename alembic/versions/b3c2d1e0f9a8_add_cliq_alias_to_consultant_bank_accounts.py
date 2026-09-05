"""add cliq_alias to consultant_bank_accounts

Revision ID: b3c2d1e0f9a8
Revises: a2b1c3d4e5f6
Create Date: 2026-09-05 15:03:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c2d1e0f9a8'
down_revision: Union[str, Sequence[str], None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('consultant_bank_accounts')]
    if 'cliq_alias' not in columns:
        op.add_column('consultant_bank_accounts', sa.Column('cliq_alias', sa.String(length=100), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('consultant_bank_accounts')]
    if 'cliq_alias' in columns:
        op.drop_column('consultant_bank_accounts', 'cliq_alias')
