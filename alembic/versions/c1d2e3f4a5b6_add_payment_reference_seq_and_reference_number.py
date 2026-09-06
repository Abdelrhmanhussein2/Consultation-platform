"""add_payment_reference_seq_and_reference_number

Revision ID: c1d2e3f4a5b6
Revises: f1a2b3c4d5e6
Create Date: 2026-09-06 23:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Create PostgreSQL sequence payment_reference_seq if not exists
    op.execute("""
        CREATE SEQUENCE IF NOT EXISTS payment_reference_seq
        START WITH 1
        INCREMENT BY 1;
    """)

    # 2. Add reference_number column to invoices table if not present
    if 'invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('invoices')]
        if 'reference_number' not in columns:
            op.add_column('invoices', sa.Column('reference_number', sa.String(50), nullable=True))
            op.create_unique_constraint('uq_invoices_reference_number', 'invoices', ['reference_number'])

    # 3. Add reference_number column to recurring_invoices table if not present
    if 'recurring_invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('recurring_invoices')]
        if 'reference_number' not in columns:
            op.add_column('recurring_invoices', sa.Column('reference_number', sa.String(50), nullable=True))
            op.create_unique_constraint('uq_recurring_invoices_reference_number', 'recurring_invoices', ['reference_number'])

    # 4. Add reference_number column to refunded_invoices table if not present
    if 'refunded_invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('refunded_invoices')]
        if 'reference_number' not in columns:
            op.add_column('refunded_invoices', sa.Column('reference_number', sa.String(50), nullable=True))
            op.create_unique_constraint('uq_refunded_invoices_reference_number', 'refunded_invoices', ['reference_number'])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'refunded_invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('refunded_invoices')]
        if 'reference_number' in columns:
            op.drop_constraint('uq_refunded_invoices_reference_number', 'refunded_invoices', type_='unique')
            op.drop_column('refunded_invoices', 'reference_number')

    if 'recurring_invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('recurring_invoices')]
        if 'reference_number' in columns:
            op.drop_constraint('uq_recurring_invoices_reference_number', 'recurring_invoices', type_='unique')
            op.drop_column('recurring_invoices', 'reference_number')

    if 'invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('invoices')]
        if 'reference_number' in columns:
            op.drop_constraint('uq_invoices_reference_number', 'invoices', type_='unique')
            op.drop_column('invoices', 'reference_number')

    op.execute("DROP SEQUENCE IF EXISTS payment_reference_seq;")
