"""invoice_and_payment_sequences

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-09-07 00:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Create PostgreSQL sequences if not exist
    op.execute("""
        CREATE SEQUENCE IF NOT EXISTS invoice_number_seq
        START WITH 1
        INCREMENT BY 1;
        
        CREATE SEQUENCE IF NOT EXISTS payment_reference_seq
        START WITH 1
        INCREMENT BY 1;
    """)

    # 2. Ensure payment_reference / reference_number columns on invoices
    if 'invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('invoices')]
        if 'reference_number' not in columns and 'payment_reference' not in columns:
            op.add_column('invoices', sa.Column('reference_number', sa.String(50), nullable=True))
            op.create_unique_constraint('uq_invoices_reference_number', 'invoices', ['reference_number'])

    # 3. Ensure columns on recurring_invoices
    if 'recurring_invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('recurring_invoices')]
        if 'reference_number' not in columns:
            op.add_column('recurring_invoices', sa.Column('reference_number', sa.String(50), nullable=True))
            op.create_unique_constraint('uq_recurring_invoices_reference_number', 'recurring_invoices', ['reference_number'])

    # 4. Ensure columns on refunded_invoices
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

    op.execute("DROP SEQUENCE IF EXISTS invoice_number_seq;")
    op.execute("DROP SEQUENCE IF EXISTS payment_reference_seq;")
