"""alter_logo_and_signature_url_to_text

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-09-07 01:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f4a5b6c7d8e9'
down_revision: Union[str, Sequence[str], None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.alter_column('invoices', 'logo_url', type_=sa.Text(), existing_type=sa.String(500), nullable=True)
    op.alter_column('invoices', 'signature_url', type_=sa.Text(), existing_type=sa.String(500), nullable=True)

def downgrade() -> None:
    op.alter_column('invoices', 'logo_url', type_=sa.String(500), existing_type=sa.Text(), nullable=True)
    op.alter_column('invoices', 'signature_url', type_=sa.String(500), existing_type=sa.Text(), nullable=True)
