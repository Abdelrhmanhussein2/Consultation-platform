"""add prints_total and prints_used to user_subscriptions

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-11-18 20:42:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS prints_total INTEGER NOT NULL DEFAULT 5;"))
    conn.execute(sa.text("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS prints_used INTEGER NOT NULL DEFAULT 0;"))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS prints_total;"))
    conn.execute(sa.text("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS prints_used;"))
