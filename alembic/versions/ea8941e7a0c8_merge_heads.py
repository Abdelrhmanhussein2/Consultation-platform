"""merge_heads

Revision ID: ea8941e7a0c8
Revises: a7b8c9d0e1f2, b2c3d4e5f6a7
Create Date: 2026-11-06 16:18:43.805413

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea8941e7a0c8'
down_revision: Union[str, Sequence[str], None] = ('a7b8c9d0e1f2', 'b2c3d4e5f6a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
