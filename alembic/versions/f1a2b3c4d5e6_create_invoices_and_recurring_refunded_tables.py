"""create_invoices_and_recurring_refunded_tables

Revision ID: f1a2b3c4d5e6
Revises: e7f8a9b0c1d2
Create Date: 2026-09-06 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'b3c2d1e0f9a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Ensure Enum types exist if using PostgreSQL
    if bind.dialect.name == "postgresql":
        op.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
                    CREATE TYPE invoice_type AS ENUM ('subscription', 'appointment', 'service', 'other');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
                    CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled', 'refunded', 'partial', 'overdue');
                END IF;
            END $$;
        """)

    # 2. invoices
    if 'invoices' not in existing_tables:
        op.create_table(
            'invoices',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('invoice_number', sa.String(50), nullable=False, unique=True),
            sa.Column('type', sa.String(50), nullable=False, server_default='service'),
            sa.Column('appointment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='SET NULL'), nullable=True),
            sa.Column('issued_to_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('tax_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('total_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('currency', sa.String(10), nullable=False, server_default='JOD'),
            sa.Column('status', sa.String(50), nullable=False, server_default='paid'),
            sa.Column('payment_method', sa.String(50), nullable=True),
            sa.Column('issued_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
        )

    # 3. recurring_invoices
    if 'recurring_invoices' not in existing_tables:
        op.create_table(
            'recurring_invoices',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('recurring_number', sa.String(50), nullable=False, unique=True),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
            sa.Column('user_name', sa.String(200), nullable=True),
            sa.Column('user_email', sa.String(200), nullable=True),
            sa.Column('cycle', sa.String(50), nullable=False, server_default='monthly'),
            sa.Column('issued_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('paid_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('status', sa.String(50), nullable=False, server_default='active'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
        )

    # 4. refunded_invoices
    if 'refunded_invoices' not in existing_tables:
        op.create_table(
            'refunded_invoices',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('refund_number', sa.String(50), nullable=False, unique=True),
            sa.Column('invoice_number', sa.String(50), nullable=True),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
            sa.Column('user_name', sa.String(200), nullable=True),
            sa.Column('service_name', sa.String(300), nullable=True),
            sa.Column('original_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('refund_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('bearer', sa.String(100), nullable=False, server_default='المنصة'),
            sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
            sa.Column('reason', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
        )


def downgrade() -> None:
    op.drop_table('refunded_invoices')
    op.drop_table('recurring_invoices')
    op.drop_table('invoices')
